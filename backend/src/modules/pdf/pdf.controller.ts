import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Response } from 'express';

@Controller('pdf')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN)
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Get('bordereau/:visaCaseId')
  async generateBordereau(@Param('visaCaseId') visaCaseId: string, @Res() res: Response) {
    await this.pdfService.generateBordereau(visaCaseId, res);
  }
}
