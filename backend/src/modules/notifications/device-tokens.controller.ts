import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsOptional } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FcmService } from './fcm.service';

class RegisterTokenDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  platform?: string;
}

@ApiTags('Device Tokens')
@ApiBearerAuth()
@Controller('device-tokens')
@UseGuards(AuthGuard('jwt'))
export class DeviceTokensController {
  constructor(private fcmService: FcmService) {}

  @Post()
  @ApiOperation({ summary: 'Register FCM device token' })
  async register(@Body() dto: RegisterTokenDto, @CurrentUser('id') userId: string) {
    await this.fcmService.registerToken(userId, dto.token, dto.platform ?? 'android');
    return { success: true };
  }

  @Delete(':token')
  @ApiOperation({ summary: 'Unregister FCM device token' })
  async unregister(@Param('token') token: string) {
    await this.fcmService.unregisterToken(token);
    return { success: true };
  }
}
