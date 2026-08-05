import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRequiredDocumentDto,
  UpdateRequiredDocumentDto,
  QueryRequiredDocumentDto,
} from './dto';

@Injectable()
export class RequiredDocumentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.requiredDocument.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  /**
   * The checklist for one application: items pinned to this country or visa
   * type, plus the general ones. An item with both fields empty applies
   * everywhere, mirroring how message templates match.
   */
  async findForCase(query: QueryRequiredDocumentDto) {
    const items = await this.prisma.requiredDocument.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });

    return items.filter((item) => {
      if (item.country && item.country !== query.country) return false;
      if (item.visaType && item.visaType !== query.visaType) return false;
      return true;
    });
  }

  create(dto: CreateRequiredDocumentDto) {
    return this.prisma.requiredDocument.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateRequiredDocumentDto) {
    const existing = await this.prisma.requiredDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document requis introuvable');
    return this.prisma.requiredDocument.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    const existing = await this.prisma.requiredDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document requis introuvable');
    await this.prisma.requiredDocument.delete({ where: { id } });
  }
}
