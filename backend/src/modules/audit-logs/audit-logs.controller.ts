import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { QueryAuditLogDto } from './dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class AuditLogsController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }
}
