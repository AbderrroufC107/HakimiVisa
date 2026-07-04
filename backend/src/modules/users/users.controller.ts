import { Body, Controller, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateManagerDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('managers')
  @Roles(UserRole.ADMIN)
  createManager(@Body() dto: CreateManagerDto, @CurrentUser('id') userId: string) {
    return this.usersService.createManager(dto, userId);
  }
}
