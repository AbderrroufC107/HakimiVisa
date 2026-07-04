import { Controller, Get, Post, Delete, Param, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('backups')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Post()
  async create(@CurrentUser('id') userId: string) {
    return this.backupService.create(userId);
  }

  @Get()
  async findAll() {
    return this.backupService.findAll();
  }

  @Get('settings')
  async getSettings() {
    return this.backupService.getSettings();
  }

  @Post('settings')
  async updateSettings(@Body() data: { enabled?: boolean; frequency?: string; time?: string; retentionDays?: number; maxBackups?: number }) {
    return this.backupService.updateSettings(data);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    await this.backupService.download(id, res);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.backupService.restore(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.backupService.remove(id);
  }
}
