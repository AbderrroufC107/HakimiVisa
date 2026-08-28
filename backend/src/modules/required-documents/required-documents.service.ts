import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    const applicable = items.filter((item) => {
      if (item.country && item.country !== query.country) return false;
      if (item.visaType && item.visaType !== query.visaType) return false;
      return true;
    });

    // A general item and one pinned to this country can carry the same label,
    // which would ask the agency for the same paper twice. Keep the more
    // specific of the two.
    const specificity = (item: (typeof applicable)[number]) =>
      (item.country ? 2 : 0) + (item.visaType ? 1 : 0);

    const byLabel = new Map<string, (typeof applicable)[number]>();
    for (const item of applicable) {
      const key = item.label.trim().toLowerCase();
      const kept = byLabel.get(key);
      if (!kept || specificity(item) > specificity(kept)) byLabel.set(key, item);
    }

    return applicable.filter((item) => byLabel.get(item.label.trim().toLowerCase()) === item);
  }

  async create(dto: CreateRequiredDocumentDto) {
    await this.assertLabelIsFree(dto.label, dto.country, dto.visaType);
    return this.prisma.requiredDocument.create({ data: { ...dto } });
  }

  /**
   * The same document must not be asked for twice under the same country and
   * visa type — the agency would see two identical slots and not know whether
   * one paper or two were wanted.
   */
  private async assertLabelIsFree(
    label: string | undefined,
    country?: string | null,
    visaType?: string | null,
    ignoreId?: string,
  ) {
    if (!label?.trim()) return;
    const clash = await this.prisma.requiredDocument.findFirst({
      where: {
        label: { equals: label.trim() },
        country: country ?? null,
        visaType: visaType ?? null,
        ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException(
        `« ${label.trim()} » figure déjà dans cette liste. Modifiez l'existant plutôt que d'en ajouter un second.`,
      );
    }
  }

  async update(id: string, dto: UpdateRequiredDocumentDto) {
    const existing = await this.prisma.requiredDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document requis introuvable');
    await this.assertLabelIsFree(
      dto.label ?? existing.label,
      dto.country !== undefined ? dto.country : existing.country,
      dto.visaType !== undefined ? dto.visaType : existing.visaType,
      id,
    );
    return this.prisma.requiredDocument.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    const existing = await this.prisma.requiredDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document requis introuvable');
    await this.prisma.requiredDocument.delete({ where: { id } });
  }
}
