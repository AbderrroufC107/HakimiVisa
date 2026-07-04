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
