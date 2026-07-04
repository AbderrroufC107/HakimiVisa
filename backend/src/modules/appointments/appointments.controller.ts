import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAppointmentDto, UpdateAppointmentDto, QueryAppointmentDto } from './dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser('id') userId: string) {
    return this.appointmentsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: QueryAppointmentDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @CurrentUser('id') userId: string) {
    return this.appointmentsService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.appointmentsService.remove(id, userId);
  }
}
