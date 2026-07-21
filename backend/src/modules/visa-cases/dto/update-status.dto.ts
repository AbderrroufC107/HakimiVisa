import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { VisaStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(VisaStatus)
  status: VisaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
