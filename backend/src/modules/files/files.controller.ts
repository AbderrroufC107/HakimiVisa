import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { FilesService } from './files.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Files')
@Controller('clients/:clientId/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          cb(new BadRequestException('Only PDF, JPG, PNG, WEBP files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a file for a client' })
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @Param('clientId') clientId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.filesService.uploadFile(clientId, file);
  }

  @Get()
  async getFiles(@Param('clientId') clientId: string) {
    return this.filesService.getFilesByClient(clientId);
  }

  @Get('usage')
  async getUsage(@Param('clientId') clientId: string) {
    return this.filesService.getClientStorageUsage(clientId);
  }

  @Get(':fileId/download')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const file = await this.filesService.getFile(fileId);
    if (!fs.existsSync(file.path)) {
      res.status(404).json({ message: 'File not found on disk' });
      return;
    }
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
    });
    fs.createReadStream(file.path).pipe(res);
  }

  @Delete(':fileId')
  async deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.filesService.deleteFile(fileId);
  }
}
