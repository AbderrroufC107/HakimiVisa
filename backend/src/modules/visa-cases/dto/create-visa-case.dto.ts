import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { VisaStatus } from '@prisma/client';

export class CreateVisaCaseDto {
  @IsString()
  @MinLength(1)
  clientId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  visaCountry: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  visaType: string;

  @IsOptional()
  @IsEnum(VisaStatus)
  currentStatus?: VisaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
