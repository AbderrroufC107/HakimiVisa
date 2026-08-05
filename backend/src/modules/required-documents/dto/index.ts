import { IsString, IsOptional, IsBoolean, IsInt, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRequiredDocumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  label: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  visaType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateRequiredDocumentDto extends CreateRequiredDocumentDto {
  @IsString()
  @IsOptional()
  declare label: string;
}

export class QueryRequiredDocumentDto {
  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  visaType?: string;
}
