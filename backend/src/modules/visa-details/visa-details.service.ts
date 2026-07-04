import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { CreateVisaDetailsDto, UpdateVisaDetailsDto } from './dto';

@Injectable()
export class VisaDetailsService {
  private readonly logger = new Logger(VisaDetailsService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async create(visaCaseId: string, dto: CreateVisaDetailsDto, userId: string) {
    const visaCase = await this.prisma.visaCase.findUnique({ where: { id: visaCaseId } });
    if (!visaCase) throw new NotFoundException('Visa case not found');

    if (visaCase.currentStatus !== 'VISA_OK') {
      throw new BadRequestException('Visa details can only be added when status is VISA_OK');
    }

    const existing = await this.prisma.visaDetails.findUnique({ where: { visaCaseId } });
    if (existing) throw new BadRequestException('Visa details already exist for this case');

    const details = await this.prisma.visaDetails.create({
      data: {
        visaCaseId,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        durationDays: dto.durationDays,
        entryType: dto.entryType,
        visaNumber: dto.visaNumber,
        notes: dto.notes,
      },
    });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'VisaDetails',
      entityId: details.id,
      userId,
      metadata: { visaCaseId, entryType: dto.entryType },
    });

    return details;
  }

  async findByVisaCase(visaCaseId: string) {
    const details = await this.prisma.visaDetails.findUnique({
      where: { visaCaseId },
    });
    return details;
  }

  async update(visaCaseId: string, dto: UpdateVisaDetailsDto, userId: string) {
    const existing = await this.prisma.visaDetails.findUnique({ where: { visaCaseId } });
    if (!existing) throw new NotFoundException('Visa details not found');

    const data: Record<string, unknown> = { ...dto };
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);

    const details = await this.prisma.visaDetails.update({
      where: { visaCaseId },
      data,
    });

    await this.auditLog.log({
      action: 'UPDATE',
      entity: 'VisaDetails',
      entityId: details.id,
      userId,
      metadata: { visaCaseId },
    });

    return details;
  }

  async remove(visaCaseId: string, userId: string) {
    const existing = await this.prisma.visaDetails.findUnique({ where: { visaCaseId } });
    if (!existing) throw new NotFoundException('Visa details not found');

    await this.prisma.visaDetails.delete({ where: { visaCaseId } });

    await this.auditLog.log({
      action: 'DELETE',
      entity: 'VisaDetails',
      entityId: existing.id,
      userId,
      metadata: { visaCaseId },
    });
  }
}
