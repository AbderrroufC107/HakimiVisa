import { IsEnum } from 'class-validator';
import { VisaStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(VisaStatus)
  status: VisaStatus;
}
