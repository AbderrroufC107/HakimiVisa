import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateNotificationDto, QueryNotificationDto, BroadcastNotificationDto } from './dto';
import type { JwtRequest } from '../../common/interfaces';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Post('broadcast')
  @Roles(UserRole.ADMIN)
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtRequest['user'],
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.findByUser(user.id, query);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtRequest['user']) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtRequest['user'],
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: JwtRequest['user']) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtRequest['user'],
  ) {
    return this.notificationsService.remove(id, user.id);
  }
}
