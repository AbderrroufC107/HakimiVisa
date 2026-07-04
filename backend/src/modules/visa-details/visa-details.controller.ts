import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { VisaDetailsService } from './visa-details.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateVisaDetailsDto, UpdateVisaDetailsDto } from './dto';

@Controller('visa-cases/:visaCaseId/visa-details')
@UseGuards(JwtAuthGuard)
export class VisaDetailsController {
  constructor(private visaDetailsService: VisaDetailsService) {}

  @Post()
  create(
    @Param('visaCaseId') visaCaseId: string,
    @Body() dto: CreateVisaDetailsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visaDetailsService.create(visaCaseId, dto, userId);
  }

  @Get()
  findByVisaCase(@Param('visaCaseId') visaCaseId: string) {
    return this.visaDetailsService.findByVisaCase(visaCaseId);
  }

  @Patch()
  update(
    @Param('visaCaseId') visaCaseId: string,
    @Body() dto: UpdateVisaDetailsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visaDetailsService.update(visaCaseId, dto, userId);
  }

  @Delete()
  remove(
    @Param('visaCaseId') visaCaseId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visaDetailsService.remove(visaCaseId, userId);
  }
}
