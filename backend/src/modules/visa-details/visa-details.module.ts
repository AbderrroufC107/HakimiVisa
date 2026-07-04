import { Module } from '@nestjs/common';
import { VisaDetailsController } from './visa-details.controller';
import { VisaDetailsService } from './visa-details.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [VisaDetailsController],
  providers: [VisaDetailsService],
})
export class VisaDetailsModule {}
