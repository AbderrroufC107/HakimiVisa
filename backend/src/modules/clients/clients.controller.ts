import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.clientsService.getDashboardStats();
  }

  @Get('analytics')
  getAnalytics() {
    return this.clientsService.getAnalytics();
  }

  @Post()
  create(@Body() dto: CreateClientDto, @CurrentUser('id') userId: string) {
    return this.clientsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: QueryClientDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    return this.clientsService.getProfile(id);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.clientsService.getTimeline(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.clientsService.getStats(id);
  }

  @Get(':id/documents')
  getDocuments(@Param('id') id: string) {
    return this.clientsService.getDocuments(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.clientsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clientsService.remove(id, userId);
  }
}
