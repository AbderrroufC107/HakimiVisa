import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { DeviceTokensController } from './device-tokens.controller';
import { PublicDeviceTokensController } from './public-device-tokens.controller';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';

@Module({
  controllers: [NotificationsController, DeviceTokensController, PublicDeviceTokensController],
  providers: [NotificationsService, FcmService],
  exports: [NotificationsService, FcmService],
})
export class NotificationsModule {}
