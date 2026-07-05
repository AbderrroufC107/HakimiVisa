import { Injectable } from '@nestjs/common';
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
}
