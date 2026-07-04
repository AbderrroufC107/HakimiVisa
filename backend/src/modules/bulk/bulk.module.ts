import { Module } from '@nestjs/common';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PdfModule } from '../pdf/pdf.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [AuditLogsModule, NotificationsModule, PdfModule, ExcelModule],
  controllers: [BulkController],
  providers: [BulkService],
})
export class BulkModule {}
