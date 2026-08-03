import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VisaStatus } from '@prisma/client';

export class QueryVisaCaseDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(VisaStatus)
  @IsOptional()
  status?: VisaStatus;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
