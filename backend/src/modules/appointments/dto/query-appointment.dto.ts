import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { AppointmentType } from '@prisma/client';

export class QueryAppointmentDto {
  @IsOptional()
  @IsString()
  visaCaseId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  appointmentType?: AppointmentType;

  @IsOptional()
  @IsString()
  search?: string;
}
