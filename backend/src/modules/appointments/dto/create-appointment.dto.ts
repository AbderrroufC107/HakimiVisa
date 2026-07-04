import { IsString, IsEnum, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';
import { AppointmentType } from '@prisma/client';

export class CreateAppointmentDto {
  @IsString()
  @MinLength(1)
  visaCaseId: string;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  appointmentTime: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  appointmentCenter: string;

  @IsEnum(AppointmentType)
  appointmentType: AppointmentType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
