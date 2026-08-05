import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { CreateAgencyDto, UpdateAgencyDto, CreateAgencyUserDto } from './dto';

@Injectable()
export class AgenciesService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findAll() {
    return this.prisma.agency.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, visaCases: true } },
      },
    });
  }

  async findOne(id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { visaCases: true } },
      },
    });
    if (!agency) throw new NotFoundException('Agence introuvable');
    return agency;
  }

  async create(dto: CreateAgencyDto, userId: string) {
    const agency = await this.prisma.agency.create({ data: { ...dto } });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'Agency',
      entityId: agency.id,
      userId,
      metadata: { name: agency.name },
    });

    return agency;
  }

  async update(id: string, dto: UpdateAgencyDto, userId: string) {
    await this.findOne(id);
    const agency = await this.prisma.agency.update({ where: { id }, data: { ...dto } });

    await this.auditLog.log({
      action: 'UPDATE',
      entity: 'Agency',
      entityId: id,
      userId,
      metadata: { name: agency.name },
    });

    return agency;
  }

  async remove(id: string, userId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: { _count: { select: { visaCases: true } } },
    });
    if (!agency) throw new NotFoundException('Agence introuvable');

    // Deleting would orphan the history; deactivating keeps the cases readable
    // while stopping the agency signing in.
    if (agency._count.visaCases > 0) {
      throw new ConflictException(
        `Cette agence a ${agency._count.visaCases} dossier(s). Désactivez-la au lieu de la supprimer.`,
      );
    }

    await this.prisma.agency.delete({ where: { id } });
    await this.auditLog.log({
      action: 'DELETE',
      entity: 'Agency',
      entityId: id,
      userId,
      metadata: { name: agency.name },
    });
  }

  /** The agency's login: an AGENCY user permanently bound to this agency. */
  async createUser(agencyId: string, dto: CreateAgencyUserDto, userId: string) {
    await this.findOne(agencyId);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await bcrypt.hash(dto.password, 12),
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'AGENCY',
        agencyId,
      },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
    });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      userId,
      metadata: { email: user.email, agencyId },
    });

    return user;
  }
}
