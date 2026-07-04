import { IsArray, IsString, IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { AppointmentType } from '@prisma/client';

export class BulkAppointmentDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];

  @IsDateString()
  appointmentDate: string;

  @IsString()
  @IsNotEmpty()
  appointmentTime: string;

  @IsString()
  @IsNotEmpty()
  appointmentCenter: string;

  @IsEnum(AppointmentType)
  appointmentType: AppointmentType;

  @IsOptional()
  @IsString()
  notes?: string;
}
