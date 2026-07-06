import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'client-files');

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async uploadFile(clientId: string, file: Express.Multer.File) {
    const existing = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!existing) throw new NotFoundException('Client not found');

    const clientDir = path.join(UPLOAD_DIR, clientId);
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(clientDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return this.prisma.clientFile.create({
      data: {
        clientId,
        fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
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
