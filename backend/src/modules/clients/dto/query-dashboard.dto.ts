import { IsDateString, IsOptional } from 'class-validator';

export class QueryDashboardDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
