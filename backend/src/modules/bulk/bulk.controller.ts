import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { BulkService } from './bulk.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { BulkStatusChangeDto, BulkAppointmentDto, BulkIdsDto } from './dto';

@Controller('bulk')
@UseGuards(JwtAuthGuard)
export class BulkController {
  constructor(private bulkService: BulkService) {}

  @Post('status-change')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async statusChange(@Body() dto: BulkStatusChangeDto, @CurrentUser('id') userId: string) {
    return this.bulkService.statusChange(dto, userId);
  }

  @Post('appointment')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async createAppointments(@Body() dto: BulkAppointmentDto, @CurrentUser('id') userId: string) {
    return this.bulkService.createAppointments(dto, userId);
  }

  @Post('pdf')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async exportPdf(@Body() dto: BulkIdsDto, @Res() res: Response) {
    await this.bulkService.exportPdf(dto, res);
  }

  @Post('excel')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async exportExcel(@Body() dto: BulkIdsDto, @Res() res: Response) {
    const buffer = await this.bulkService.exportExcel(dto);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="bulk-export-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Post('archive')
  @Roles(UserRole.ADMIN)
  async archive(@Body() dto: BulkIdsDto, @CurrentUser('id') userId: string) {
    return this.bulkService.archive(dto, userId);
  }

  @Post('restore')
  @Roles(UserRole.ADMIN)
  async restore(@Body() dto: BulkIdsDto, @CurrentUser('id') userId: string) {
    return this.bulkService.restore(dto, userId);
  }

  @Post('delete')
  @Roles(UserRole.ADMIN)
  async delete(@Body() dto: BulkIdsDto, @CurrentUser('id') userId: string) {
    return this.bulkService.delete(dto, userId);
  }
}
