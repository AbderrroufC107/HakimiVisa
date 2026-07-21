import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { PublicTrackingService } from './public-tracking.service';
import { PublicTrackingQueryDto } from './dto/public-tracking-query.dto';

@Controller('public/tracking')
export class PublicTrackingController {
  constructor(private readonly publicTrackingService: PublicTrackingService) {}

  @Public()
  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async search(@Query() query: PublicTrackingQueryDto) {
    return this.publicTrackingService.findByPassport(query);
  }

  @Public()
  @Get('appointments')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async searchAppointments(@Query('phone') phone: string) {
    return this.publicTrackingService.findAppointmentsByPhone(phone);
  }

  @Public()
  @Get('documents')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async searchDocuments(@Query('phone') phone: string) {
    return this.publicTrackingService.findDocumentsByPhone(phone);
  }

  @Public()
  @Get('notifications')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async searchNotifications(@Query('phone') phone: string) {
    return this.publicTrackingService.findNotificationsByPhone(phone);
  }

  @Public()
  @Get(':caseNumber')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getCase(@Param('caseNumber') caseNumber: string) {
    return this.publicTrackingService.findByCaseNumber(caseNumber);
  }

  @Public()
  @Get(':caseNumber/timeline')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getTimeline(@Param('caseNumber') caseNumber: string) {
    return this.publicTrackingService.findTimelineByCaseNumber(caseNumber);
  }

  @Public()
  @Get(':caseNumber/appointments')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getAppointments(@Param('caseNumber') caseNumber: string) {
    return this.publicTrackingService.findAppointmentsByCaseNumber(caseNumber);
  }

  @Public()
  @Get(':caseNumber/documents')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getDocuments(@Param('caseNumber') caseNumber: string) {
    return this.publicTrackingService.findDocumentsByCaseNumber(caseNumber);
  }

  @Public()
  @Get(':caseNumber/notifications')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getNotifications(@Param('caseNumber') caseNumber: string) {
    return this.publicTrackingService.findNotificationsByCaseNumber(caseNumber);
  }
}
