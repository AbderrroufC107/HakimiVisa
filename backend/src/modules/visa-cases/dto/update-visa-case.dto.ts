import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { CreateVisaCaseDto } from './create-visa-case.dto';

export class UpdateVisaCaseDto extends PartialType(CreateVisaCaseDto) {
  clientId?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
