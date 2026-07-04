import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { VisaExpirationService } from './visa-expiration.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('visa-expiration')
@UseGuards(JwtAuthGuard)
export class VisaExpirationController {
  constructor(private visaExpirationService: VisaExpirationService) {}

  @Get()
  getExpiring(@Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    return this.visaExpirationService.getExpiringSummary(d);
  }
}
