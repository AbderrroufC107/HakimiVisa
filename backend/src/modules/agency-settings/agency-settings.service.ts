import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAgencySettingsDto } from './dto';

@Injectable()
export class AgencySettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const settings = await this.prisma.agencySettings.findFirst();
    if (!settings) {
      throw new NotFoundException('Agency settings not found');
    }
    return settings;
  }

  /**
   * Contact details shown to clients in the public app. Only the fields an
   * agency would print on a business card — never the full settings row.
   */
  async getPublicContact() {
    const settings = await this.prisma.agencySettings.findFirst({
      select: {
        agencyName: true,
        agencyAddress: true,
        agencyPhone: true,
        agencyEmail: true,
        agencyWebsite: true,
        logoUrl: true,
      },
    });
    return settings ?? {
      agencyName: null,
      agencyAddress: null,
      agencyPhone: null,
      agencyEmail: null,
      agencyWebsite: null,
      logoUrl: null,
    };
  }

  async upsert(dto: UpdateAgencySettingsDto) {
    const existing = await this.prisma.agencySettings.findFirst();
    if (existing) {
      return this.prisma.agencySettings.update({
        where: { id: existing.id },
        data: dto,
      });
    }
    return this.prisma.agencySettings.create({ data: dto as any });
  }

  async updateLogo(logoUrl: string) {
    const existing = await this.prisma.agencySettings.findFirst();
    if (!existing) {
      return this.prisma.agencySettings.create({
        data: { agencyName: 'Default Agency', logoUrl },
      });
    }
    return this.prisma.agencySettings.update({
      where: { id: existing.id },
      data: { logoUrl },
    });
  }
}
