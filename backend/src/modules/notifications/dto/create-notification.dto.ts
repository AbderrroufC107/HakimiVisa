import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  link?: string;
}
