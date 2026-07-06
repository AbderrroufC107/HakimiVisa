import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'client-files');
const COMPRESS_THRESHOLD = 100 * 1024;
const IMAGE_QUALITY = 80;
const IMAGE_MAX_WIDTH = 1920;

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  private isImage(mimetype: string): boolean {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(mimetype);
  }

  private async compressImage(buffer: Buffer, mimetype: string): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      let pipeline = image;
      if (metadata.width && metadata.width > IMAGE_MAX_WIDTH) {
        pipeline = pipeline.resize(IMAGE_MAX_WIDTH, null, { withoutEnlargement: true });
      }

      if (mimetype === 'image/jpeg' || mimetype === 'image/webp') {
        pipeline = pipeline.jpeg({ quality: IMAGE_QUALITY, mozjpeg: true });
      } else if (mimetype === 'image/png') {
        pipeline = pipeline.png({ compressionLevel: 9, effort: 10 });
      }

      return await pipeline.toBuffer();
    } catch (err) {
      this.logger.warn('Image compression failed, using original');
      return buffer;
    }
  }

  async uploadFile(clientId: string, file: Express.Multer.File) {
    const existing = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!existing) throw new NotFoundException('Client not found');

    const clientDir = path.join(UPLOAD_DIR, clientId);
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }

    let buffer = file.buffer;
    let savedSize = file.size;

    if (this.isImage(file.mimetype) && file.size > COMPRESS_THRESHOLD) {
      buffer = await this.compressImage(buffer, file.mimetype);
      savedSize = buffer.length;
    }

    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(clientDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return this.prisma.clientFile.create({
      data: {
        clientId,
        fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: savedSize,
        path: filePath,
      },
    });
  }

  async getFilesByClient(clientId: string) {
    return this.prisma.clientFile.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });
  }

  async getFile(fileId: string) {
    const file = await this.prisma.clientFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async deleteFile(fileId: string) {
    const file = await this.prisma.clientFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete file from disk: ${file.path}`);
    }

    return this.prisma.clientFile.delete({ where: { id: fileId } });
  }

  async getClientStorageUsage(clientId: string) {
    const result = await this.prisma.clientFile.aggregate({
      where: { clientId },
      _sum: { size: true },
      _count: true,
    });
    return {
      totalSize: result._sum.size ?? 0,
      fileCount: result._count,
    };
  }
}
