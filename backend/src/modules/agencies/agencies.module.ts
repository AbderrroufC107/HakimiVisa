import { Module } from '@nestjs/common';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [AgenciesController],
  providers: [AgenciesService, PrismaService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
