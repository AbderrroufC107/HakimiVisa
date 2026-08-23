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
import {
  CreateClientDto,
  UpdateClientDto,
  QueryClientDto,
  QueryDashboardDto,
} from './dto';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('dashboard')
  getDashboardStats(
    @Query() query: QueryDashboardDto,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.clientsService.getDashboardStats(query, agencyId);
  }

  @Get('analytics')
  getAnalytics(@CurrentUser('agencyId') agencyId: string | null) {
    return this.clientsService.getAnalytics(agencyId);
  }

  @Post()
  create(@Body() dto: CreateClientDto, @CurrentUser('id') userId: string) {
    return this.clientsService.create(dto, userId);
  }

  @Get()
  findAll(
    @Query() query: QueryClientDto,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.clientsService.findAll(query, agencyId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.clientsService.findOne(id, agencyId);
  }

  @Get(':id/profile')
  getProfile(
    @Param('id') id: string,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.clientsService.getProfile(id, agencyId);
  }

  @Get(':id/timeline')
  getTimeline(
    @Param('id') id: string,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.clientsService.getTimeline(id, agencyId);
  }

  @Get(':id/stats')
  getStats(
    @Param('id') id: string,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.clientsService.getStats(id, agencyId);
  }

  @Get(':id/documents')
  getDocuments(
    @Param('id') id: string,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.clientsService.getDocuments(id, agencyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.clientsService.update(id, dto, userId, agencyId);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clientsService.remove(id, userId);
  }
}
