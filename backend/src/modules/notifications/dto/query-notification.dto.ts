import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNotificationDto {
  @IsOptional()
  read?: 'true' | 'false' | boolean;

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
