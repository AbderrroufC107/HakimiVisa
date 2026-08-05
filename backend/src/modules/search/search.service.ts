import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string) {
    const clients = await this.prisma.client.findMany({
      where: {
        OR: [
          { fullName: { contains: q } },
          { phoneNumber: { contains: q } },
          { passportNumber: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        passportNumber: true,
        // A client entered by an agency's staff belongs to that agency.
        creator: { select: { agency: { select: { id: true, name: true } } } },
      },
    });

    const visaCases = await this.prisma.visaCase.findMany({
      where: {
        OR: [
          { caseNumber: { contains: q } },
          { visaCountry: { contains: q } },
          { visaType: { contains: q } },
          { client: { fullName: { contains: q } } },
        ],
      },
      take: 5,
      include: {
        client: { select: { fullName: true } },
        submittedByAgency: { select: { id: true, name: true } },
      },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        OR: [
          { appointmentCenter: { contains: q } },
          { notes: { contains: q } },
          { visaCase: { caseNumber: { contains: q } } },
          { visaCase: { client: { fullName: { contains: q } } } },
        ],
      },
      take: 5,
      include: {
        visaCase: {
          select: { caseNumber: true, client: { select: { fullName: true } } },
        },
      },
    });

    return {
      clients: clients.map((c: {
        id: string; fullName: string; phoneNumber: string; passportNumber: string | null;
        creator?: { agency?: { id: string; name: string } | null } | null;
      }) => ({
        id: c.id,
        label: c.fullName,
        sublabel: c.phoneNumber,
        href: `/clients/${c.id}`,
        type: 'client' as const,
        agencyName: c.creator?.agency?.name ?? null,
      })),
      visaCases: visaCases.map((vc: {
        id: string; caseNumber: string; visaCountry: string; client: { fullName: string };
        submittedByAgency?: { id: string; name: string } | null;
      }) => ({
        id: vc.id,
        label: vc.caseNumber,
        sublabel: `${vc.client.fullName} - ${vc.visaCountry}`,
        href: `/visa-cases/${vc.id}`,
        type: 'visa-case' as const,
        agencyName: vc.submittedByAgency?.name ?? null,
      })),
      appointments: appointments.map((a: { id: string; appointmentCenter: string; appointmentDate: Date; visaCaseId: string; visaCase: { caseNumber: string; client: { fullName: string } } }) => ({
        id: a.id,
        label: a.appointmentCenter,
        sublabel: `${a.visaCase.client.fullName} - ${a.appointmentDate.toLocaleDateString('fr-FR')}`,
        href: `/visa-cases/${a.visaCaseId}`,
        type: 'appointment' as const,
      })),
    };
  }
}
