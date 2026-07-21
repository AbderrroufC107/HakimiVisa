import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TemplateChannel } from '@prisma/client';

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsEnum(TemplateChannel)
  channel: TemplateChannel;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  visaType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appointmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body: string;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(TemplateChannel)
  channel?: TemplateChannel;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  visaType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appointmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body?: string;
}

export class RenderTemplateDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsString()
  visaCaseId: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsEnum(TemplateChannel)
  channel?: TemplateChannel;
}
