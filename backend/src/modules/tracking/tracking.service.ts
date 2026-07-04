import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackingQueryDto } from './dto';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async findByPhone(query: TrackingQueryDto) {
    const { phone, reference } = query;

    const client = await this.prisma.client.findFirst({
      where: { phoneNumber: { contains: phone } },
      select: { id: true, fullName: true },
    });

    if (!client) throw new NotFoundException('Aucun dossier trouvé avec ce numéro de téléphone');

    const where: Record<string, unknown> = { clientId: client.id };

    if (reference) {
      where.caseNumber = { contains: reference };
    }

    const cases = await this.prisma.visaCase.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        caseNumber: true,
        visaCountry: true,
        visaType: true,
        currentStatus: true,
        openingDate: true,
        updatedAt: true,
      },
    });

    return {
      clientName: client.fullName,
      cases,
      total: cases.length,
    };
  }

  async findOneForPublic(id: string) {
    const visaCase = await this.prisma.visaCase.findUnique({
      where: { id },
      select: {
        id: true,
        caseNumber: true,
        visaCountry: true,
        visaType: true,
        currentStatus: true,
        openingDate: true,
        updatedAt: true,
        client: {
          select: { id: true, fullName: true },
        },
        appointments: {
          orderBy: { appointmentDate: 'asc' },
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            appointmentCenter: true,
            appointmentType: true,
          },
        },
        visaDetails: {
          select: {
            validFrom: true,
            validUntil: true,
            durationDays: true,
            entryType: true,
            visaNumber: true,
          },
        },
        statusHistories: {
          orderBy: { changedAt: 'asc' },
          select: {
            oldStatus: true,
            newStatus: true,
            changedAt: true,
          },
        },
      },
    });

    if (!visaCase) throw new NotFoundException('Dossier non trouvé');

    return visaCase;
  }
}
