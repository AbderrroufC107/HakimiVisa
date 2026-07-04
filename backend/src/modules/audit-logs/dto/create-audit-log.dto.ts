import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AuditAction } from '@prisma/client';

export class CreateAuditLogDto {
  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  entity: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsString()
  userId: string;
}
