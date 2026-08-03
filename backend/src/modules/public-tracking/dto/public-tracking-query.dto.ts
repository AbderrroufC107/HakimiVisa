import { IsString, IsOptional, IsDateString } from 'class-validator';

export class PublicTrackingQueryDto {
  @IsOptional()
  @IsString()
  passport?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  expiry?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
