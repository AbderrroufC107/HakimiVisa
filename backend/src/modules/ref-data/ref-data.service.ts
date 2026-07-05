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
    return this.prisma.visaTypeRecord.findMany({ orderBy: { name: 'asc' } });
  }

  async createVisaType(name: string) {
    return this.prisma.visaTypeRecord.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}
