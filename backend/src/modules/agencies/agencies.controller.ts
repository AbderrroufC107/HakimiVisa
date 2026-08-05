import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAgencyDto, UpdateAgencyDto, CreateAgencyUserDto } from './dto';

/** Managing partner agencies is a back-office job: never an agency's own. */
@ApiTags('Agencies')
@Controller('agencies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
export class AgenciesController {
  constructor(private readonly agencies: AgenciesService) {}

  @Get()
  findAll() {
    return this.agencies.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agencies.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAgencyDto, @CurrentUser('id') userId: string) {
    return this.agencies.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgencyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.agencies.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.agencies.remove(id, userId);
  }

  @Post(':id/users')
  createUser(
    @Param('id') id: string,
    @Body() dto: CreateAgencyUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.agencies.createUser(id, dto, userId);
  }
}
