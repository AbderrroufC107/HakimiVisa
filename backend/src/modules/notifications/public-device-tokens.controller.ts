import { Controller, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { FcmService } from './fcm.service';

class RegisterClientTokenDto {
  @IsString()
  token: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  platform?: string;
}

@ApiTags('Public Device Tokens')
@Controller('public/device-tokens')
export class PublicDeviceTokensController {
  constructor(private fcmService: FcmService) {}

  @Public()
  @Post()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Register FCM device token for client by phone' })
  async register(@Body() dto: RegisterClientTokenDto) {
    await this.fcmService.registerClientToken(
      dto.phone,
      dto.token,
      dto.platform ?? 'android',
    );
    return { success: true };
  }

  @Public()
  @Delete(':token')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Unregister client FCM device token' })
  async unregister(@Param('token') token: string) {
    await this.fcmService.unregisterClientToken(token);
    return { success: true };
  }
}
