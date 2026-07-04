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
import { VisaCasesService } from './visa-cases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateVisaCaseDto,
  UpdateVisaCaseDto,
  UpdateStatusDto,
  QueryVisaCaseDto,
} from './dto';

@Controller('visa-cases')
@UseGuards(JwtAuthGuard)
export class VisaCasesController {
  constructor(private visaCasesService: VisaCasesService) {}

  @Post()
  create(@Body() dto: CreateVisaCaseDto, @CurrentUser('id') userId: string) {
    return this.visaCasesService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: QueryVisaCaseDto) {
    return this.visaCasesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visaCasesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVisaCaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visaCasesService.update(id, dto, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visaCasesService.updateStatus(id, dto, userId);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.visaCasesService.getHistory(id);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.visaCasesService.remove(id, userId);
  }
}
