import { Module } from '@nestjs/common';
import { VisaExpirationController } from './visa-expiration.controller';
import { VisaExpirationService } from './visa-expiration.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [VisaExpirationController],
  providers: [VisaExpirationService],
  exports: [VisaExpirationService],
})
export class VisaExpirationModule {}
