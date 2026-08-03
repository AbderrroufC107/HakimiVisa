import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Throttle } from '@nestjs/throttler';
import { AgencySettingsService } from './agency-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateAgencySettingsDto } from './dto';

@Controller('agency-settings')
@UseGuards(JwtAuthGuard)
export class AgencySettingsController {
  constructor(private agencySettingsService: AgencySettingsService) {}

  @Get()
  get() {
    return this.agencySettingsService.get();
  }

  /** Read by the client app, which has no account to authenticate with. */
  @Public()
  @Get('public/contact')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  getPublicContact() {
    return this.agencySettingsService.getPublicContact();
  }

  @Put()
  @Roles(UserRole.ADMIN)
  update(@Body() dto: UpdateAgencySettingsDto) {
    return this.agencySettingsService.upsert(dto);
  }

  @Post('logo')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'logos'),
        filename: (_req, file, cb) => {
          const name = 'agency-logo' + extname(file.originalname);
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new Error('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const logoUrl = `/uploads/logos/${file.filename}`;
    return this.agencySettingsService.updateLogo(logoUrl);
  }
}
