import { IsString, IsOptional } from 'class-validator';

export class TrackingQueryDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
