import { Module } from '@nestjs/common';
import { VisaCasesController } from './visa-cases.controller';
import { VisaCasesService } from './visa-cases.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditLogsModule, NotificationsModule],
  controllers: [VisaCasesController],
  providers: [VisaCasesService],
  exports: [VisaCasesService],
})
export class VisaCasesModule {}
