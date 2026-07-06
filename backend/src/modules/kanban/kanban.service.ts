import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryKanbanDto } from './dto';

@Injectable()
export class KanbanService {
  private readonly logger = new Logger(KanbanService.name);

  constructor(private prisma: PrismaService) {}

  async getBoard(query: QueryKanbanDto) {
    const { search, country, type, dateFrom, dateTo } = query;

    const where: Record<string, unknown> = {};

    if (country) {
      where.visaCountry = { contains: country };
    }
    if (type) {
      where.visaType = { contains: type };
    }
    if (dateFrom || dateTo) {
      const openingDate: Record<string, Date> = {};
      if (dateFrom) openingDate.gte = new Date(dateFrom);
      if (dateTo) openingDate.lte = new Date(dateTo);
      where.openingDate = openingDate;
    }
    if (search) {
      where.OR = [
        { client: { fullName: { contains: search } } },
        { client: { phoneNumber: { contains: search } } },
        { caseNumber: { contains: search } },
      ];
    }

    const cases = await this.prisma.visaCase.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            whatsappNumber: true,
            email: true,
            passportNumber: true,
            nationality: true,
          },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const grouped: Record<string, typeof cases> = {
      EN_ATTENTE: [],
      EN_TRAITEMENT: [],
      RDV_OK: [],
      LIVREE: [],
    };

    for (const c of cases) {
      const status = c.currentStatus;
      if (grouped[status]) {
        grouped[status].push(c);
      } else {
        grouped.EN_ATTENTE.push(c);
      }
    }

    const columnColors: Record<string, string> = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      EN_TRAITEMENT: 'bg-blue-100 text-blue-800 border-blue-300',
      RDV_OK: 'bg-orange-100 text-orange-800 border-orange-300',
      LIVREE: 'bg-teal-100 text-teal-800 border-teal-300',
    };

    const columnLabels: Record<string, string> = {
      EN_ATTENTE: 'En Attente',
      EN_TRAITEMENT: 'En Traitement',
      RDV_OK: 'RDV OK',
      LIVREE: 'Livrée',
    };

    const columns = Object.entries(grouped).map(([id, cards]) => ({
      id,
      title: columnLabels[id] ?? id,
      color: columnColors[id] ?? '',
      cards,
      count: cards.length,
    }));

    return columns;
  }
}
