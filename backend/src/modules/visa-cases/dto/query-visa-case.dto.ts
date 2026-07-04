import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
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
