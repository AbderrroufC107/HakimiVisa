import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExcelService } from './excel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('excel')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN)
export class ExcelController {
  constructor(private excelService: ExcelService) {}

  @Get('clients')
  async exportClients(@Res() res: Response) {
    const buffer = await this.excelService.exportClients();
    this.sendExcel(res, buffer, 'clients.xlsx');
  }

  @Get('visa-cases')
  async exportVisaCases(@Res() res: Response) {
    const buffer = await this.excelService.exportVisaCases();
    this.sendExcel(res, buffer, 'dossiers.xlsx');
  }

  @Get('appointments')
  async exportAppointments(@Res() res: Response) {
    const buffer = await this.excelService.exportAppointments();
    this.sendExcel(res, buffer, 'rendez-vous.xlsx');
  }

  private sendExcel(res: Response, buffer: Buffer, filename: string) {
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }
}
