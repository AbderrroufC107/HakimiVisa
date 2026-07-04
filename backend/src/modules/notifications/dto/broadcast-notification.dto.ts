import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class BroadcastNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  link?: string;
}
