import { IsArray, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { VisaStatus } from '@prisma/client';

export class BulkStatusChangeDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];

  @IsEnum(VisaStatus)
  status: VisaStatus;
}
