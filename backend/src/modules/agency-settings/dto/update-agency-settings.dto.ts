import { IsString, IsOptional } from 'class-validator';

export class UpdateAgencySettingsDto {
  @IsString()
  @IsOptional()
  agencyName?: string;

  @IsString()
  @IsOptional()
  agencyAddress?: string;

  @IsString()
  @IsOptional()
  agencyPhone?: string;

  @IsString()
  @IsOptional()
  agencyEmail?: string;

  @IsString()
  @IsOptional()
  agencyWebsite?: string;

  @IsString()
  @IsOptional()
  defaultCountry?: string;

  @IsString()
  @IsOptional()
  defaultVisaType?: string;

  @IsString()
  @IsOptional()
  pdfFooterText?: string;

  @IsString()
  @IsOptional()
  pdfPrimaryColor?: string;

  @IsString()
  @IsOptional()
  appointmentCenter?: string;
}
