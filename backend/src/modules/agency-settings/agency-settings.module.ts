import { Module } from '@nestjs/common';
import { AgencySettingsController } from './agency-settings.controller';
import { AgencySettingsService } from './agency-settings.service';

@Module({
  imports: [],
  controllers: [AgencySettingsController],
  providers: [AgencySettingsService],
  exports: [AgencySettingsService],
})
export class AgencySettingsModule {}
