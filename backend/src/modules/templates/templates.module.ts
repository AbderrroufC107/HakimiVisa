import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { MessagesService } from './messages.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, MessagesService],
  exports: [TemplatesService, MessagesService],
})
export class TemplatesModule {}
