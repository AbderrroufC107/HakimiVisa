import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefDataService {
  constructor(private prisma: PrismaService) {}

  async findAllCountries() {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  async createCountry(name: string) {
    return this.prisma.country.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  async updateCountry(id: string, name: string) {
    const existing = await this.prisma.country.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Country not found');
    const duplicate = await this.prisma.country.findUnique({ where: { name } });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Country name already exists');
    }
    return this.prisma.country.update({ where: { id }, data: { name } });
  }

  async removeCountry(id: string) {
    const existing = await this.prisma.country.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Country not found');
    return this.prisma.country.delete({ where: { id } });
  }

  async findAllVisaTypes() {
    return this.prisma.visaType.findMany({ orderBy: { name: 'asc' } });
  }

  async createVisaType(name: string) {
    return this.prisma.visaType.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  async updateVisaType(id: string, name: string) {
    const existing = await this.prisma.visaType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Visa type not found');
    const duplicate = await this.prisma.visaType.findUnique({ where: { name } });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Visa type name already exists');
    }
    return this.prisma.visaType.update({ where: { id }, data: { name } });
  }

  async removeVisaType(id: string) {
    const existing = await this.prisma.visaType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Visa type not found');
    return this.prisma.visaType.delete({ where: { id } });
  }
}
