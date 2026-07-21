import { IsString, IsOptional, IsDateString } from 'class-validator';

export class PublicTrackingQueryDto {
  @IsString()
  passport: string;

  @IsOptional()
  @IsDateString()
  expiry?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class PublicCaseNumberParam {
  @IsString()
  caseNumber: string;
}
