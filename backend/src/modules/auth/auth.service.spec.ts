import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let mockJwtService: DeepMockProxy<JwtService>;
  let mockConfigService: DeepMockProxy<ConfigService>;
  let mockAuditLog: DeepMockProxy<AuditLogService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'AGENT',
    isActive: true,
    password: 'hashed-password-123',
    createdAt: new Date('2025-01-01'),
  };

  const mockRefreshToken = {
    id: 'rt-1',
    token: 'refresh-token-456',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 7 * 86400000),
  };

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaClient>();
    mockJwtService = mockDeep<JwtService>();
    mockConfigService = mockDeep<ConfigService>();
    mockAuditLog = mockDeep<AuditLogService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'new@example.com',
      password: 'Str0ng!Pass',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should reject public registration when disabled', async () => {
      mockConfigService.get.mockReturnValue(false);

      await expect(service.register(dto)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should register a new user and return tokens', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password-123' as never);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce('access-token-abc')
        .mockReturnValueOnce('refresh-token-456');
      mockConfigService.getOrThrow
        .mockReturnValueOnce('refresh-secret')
        .mockReturnValueOnce('7d');
      mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshToken);
      mockAuditLog.log.mockResolvedValue({} as any);

      const result = await service.register(dto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          password: 'hashed-password-123',
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'CREATE',
        entity: 'User',
        entityId: 'user-1',
        userId: 'user-1',
        metadata: { email: 'test@example.com' },
      });
      expect(result).toHaveProperty('accessToken', 'access-token-abc');
      expect(result).toHaveProperty('refreshToken', 'refresh-token-456');
      expect(result.user).toMatchObject({
        id: 'user-1', email: 'test@example.com',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      await expect(service.register(dto)).rejects.toThrow('Email already registered');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for case-insensitive email conflict', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto: LoginDto = { email: 'test@example.com', password: 'password123' };

    it('should login successfully and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign
        .mockReturnValueOnce('access-token-xyz')
        .mockReturnValueOnce('refresh-token-789');
      mockConfigService.getOrThrow
        .mockReturnValueOnce('refresh-secret')
        .mockReturnValueOnce('7d');
      mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshToken);
      mockAuditLog.log.mockResolvedValue({} as any);

      const result = await service.login(dto);

      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'LOGIN',
        entity: 'User',
        entityId: 'user-1',
        userId: 'user-1',
      });
      expect(result.accessToken).toBe('access-token-xyz');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when account is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Account is inactive');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when email is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'unknown@test.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const token = 'valid-refresh-token';

    const expiredRefreshToken = {
      id: 'rt-expired',
      token: 'expired-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 86400000),
    };

    it('should return new tokens on valid refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshToken,
        token,
        user: mockUser,
      });
      mockPrisma.refreshToken.delete.mockResolvedValue({} as any);
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');
      mockConfigService.getOrThrow
        .mockReturnValueOnce('refresh-secret')
        .mockReturnValueOnce('7d');
      mockPrisma.refreshToken.create.mockResolvedValue({
        ...mockRefreshToken,
        id: 'rt-2',
        token: 'new-refresh-token',
      });
      mockAuditLog.log.mockResolvedValue({} as any);

      const result = await service.refreshToken(token);

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: tokenHash },
        include: { user: true },
      });
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: mockRefreshToken.id } });
      expect(result.accessToken).toBe('new-access-token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when token not found', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken('invalid-token')).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        ...expiredRefreshToken,
        user: mockUser,
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when expiresAt is just past', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-expired',
        token: 'just-expired-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 1),
        user: mockUser,
      });

      await expect(service.refreshToken('just-expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profileData = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'AGENT',
        isActive: true,
        createdAt: new Date('2025-01-01'),
      };
      mockPrisma.user.findUnique.mockResolvedValue(profileData);

      const result = await service.getProfile('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      });
      expect(result).toEqual(profileData);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(UnauthorizedException);
      await expect(service.getProfile('non-existent')).rejects.toThrow('User not found');
    });
  });
});
