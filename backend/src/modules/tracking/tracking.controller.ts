import { Controller, Get, Query, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { Public } from '../../common/decorators/public.decorator';
import { TrackingQueryDto } from './dto';
import { Throttle } from '@nestjs/throttler';

@Controller('tracking')
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Public()
  @Get()
  @Throttle({ default: { limit: 10000, ttl: 60000 } })
  findByPhone(@Query() query: TrackingQueryDto) {
    return this.trackingService.findByPhone(query);
  }

  @Public()
  @Get(':id')
  @Throttle({ default: { limit: 10000, ttl: 60000 } })
  findOne(@Param('id') id: string) {
    return this.trackingService.findOneForPublic(id);
  }
}
