import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditLog: AuditLogService,
  ) {}

  async register(dto: RegisterDto) {
    if (!this.configService.get<boolean>('auth.allowPublicRegistration')) {
      throw new ForbiddenException('Public registration is disabled');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      metadata: { email: user.email },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditLog.log({
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
    });

    return this.generateTokens({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    });
  }

  async refreshToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    return this.generateTokens({
      id: storedToken.user.id,
      email: storedToken.user.email,
      firstName: storedToken.user.firstName,
      lastName: storedToken.user.lastName,
      role: storedToken.user.role,
      isActive: storedToken.user.isActive,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
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
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      userId,
      metadata: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    return user;
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      accessToken,
      refreshToken,
    };
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh', jti: crypto.randomUUID() },
      {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>(
          'jwt.refreshExpiresIn',
        ) as jwt.SignOptions['expiresIn'],
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId,
        expiresAt,
      },
    });

    return token;
  }
}
