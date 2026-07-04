import { IsString, IsInt, IsEnum, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { EntryType } from '@prisma/client';

export class CreateVisaDetailsDto {
  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays: number;

  @IsEnum(EntryType)
  entryType: EntryType;

  @IsOptional()
  @IsString()
  visaNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
