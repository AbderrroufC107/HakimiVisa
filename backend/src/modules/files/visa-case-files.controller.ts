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

const UPLOAD_LIMITS = {
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      cb(new BadRequestException('Only PDF, JPG, PNG, WEBP files are allowed'), false);
    } else {
      cb(null, true);
    }
  },
};

/**
 * Documents belonging to one application. Files stay rows in client_files —
 * they simply carry the case id — so a client-level upload keeps working.
 */
@ApiTags('Files')
@Controller('visa-cases/:visaCaseId/files')
export class VisaCaseFilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', UPLOAD_LIMITS))
  @ApiOperation({ summary: 'Upload a document for a visa case' })
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @Param('visaCaseId') visaCaseId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.filesService.uploadToVisaCase(visaCaseId, file, agencyId);
  }

  @Get()
  @ApiOperation({ summary: 'List the documents of a visa case' })
  async getFiles(
    @Param('visaCaseId') visaCaseId: string,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.filesService.getFilesByVisaCase(visaCaseId, agencyId);
  }

  @Get(':fileId/download')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Param('visaCaseId') visaCaseId: string,
    @Res() res: Response,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    await this.filesService.getFilesByVisaCase(visaCaseId, agencyId);
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
    @Param('visaCaseId') visaCaseId: string,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    await this.filesService.getFilesByVisaCase(visaCaseId, agencyId);
    return this.filesService.deleteFile(fileId);
  }
}
