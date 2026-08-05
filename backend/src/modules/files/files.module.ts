import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { VisaCaseFilesController } from './visa-case-files.controller';
import { FilesService } from './files.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FilesController, VisaCaseFilesController],
  providers: [FilesService, PrismaService],
  exports: [FilesService],
})
export class FilesModule {}
