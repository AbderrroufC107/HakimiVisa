import { ConflictException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { CreateManagerDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async createManager(dto: CreateManagerDto, createdBy: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const password = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.MANAGER,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      userId: createdBy,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return user;
  }
}
