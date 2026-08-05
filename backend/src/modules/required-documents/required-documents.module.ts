import { Module } from '@nestjs/common';
import { RequiredDocumentsController } from './required-documents.controller';
import { RequiredDocumentsService } from './required-documents.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [RequiredDocumentsController],
  providers: [RequiredDocumentsService, PrismaService],
  exports: [RequiredDocumentsService],
})
export class RequiredDocumentsModule {}
