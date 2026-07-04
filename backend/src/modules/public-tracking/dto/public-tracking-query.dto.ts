import { IsString, IsOptional } from 'class-validator';

export class PublicTrackingQueryDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class PublicCaseNumberParam {
  @IsString()
  caseNumber: string;
}
