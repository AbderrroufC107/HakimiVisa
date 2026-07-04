import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findByClient(clientId: string) {
    return this.prisma.note.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(clientId: string, dto: CreateNoteDto, userId: string) {
    const note = await this.prisma.note.create({
      data: {
        content: dto.content,
        clientId,
        createdBy: userId,
      },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'Note',
      entityId: note.id,
      userId,
      metadata: { clientId },
    });

    return note;
  }

  async update(id: string, dto: UpdateNoteDto) {
    const existing = await this.prisma.note.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Note not found');
    const note = await this.prisma.note.update({
      where: { id },
      data: dto,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return note;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.note.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Note not found');
    await this.prisma.note.delete({ where: { id } });
    await this.auditLog.log({
      action: 'DELETE',
      entity: 'Note',
      entityId: id,
      userId,
      metadata: { clientId: existing.clientId },
    });
  }
}
