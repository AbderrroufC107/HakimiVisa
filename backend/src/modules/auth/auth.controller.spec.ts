import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: ReturnType<typeof mockDeep<AuthService>>;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'AGENT',
    isActive: true,
  };

  const mockTokens = {
    accessToken: 'at',
    refreshToken: 'rt',
    user: mockUser,
  };

  beforeEach(async () => {
    mockAuthService = mockDeep<AuthService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    controller = module.get(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should call authService.register with dto and return tokens', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'StrongPass123',
        firstName: 'Jane',
        lastName: 'Smith',
      };
      mockAuthService.register.mockResolvedValue(mockTokens);

      const result = await controller.register(dto);

      expect(result).toBe(mockTokens);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });

    it('should propagate ConflictException from service', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(
        controller.register({
          email: 'exists@test.com',
          password: 'pass12345',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('POST /auth/login', () => {
    it('should call authService.login with dto and return tokens', async () => {
      const dto = { email: 'user@example.com', password: 'password123' };
      mockAuthService.login.mockResolvedValue(mockTokens);

      const result = await controller.login(dto);

      expect(result).toBe(mockTokens);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should propagate UnauthorizedException from service', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login({ email: 'bad@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should propagate inactive account exception', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Account is inactive'),
      );

      await expect(
        controller.login({ email: 'inactive@test.com', password: 'pass' }),
      ).rejects.toThrow('Account is inactive');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call authService.refreshToken with token string', async () => {
      const dto = { refreshToken: 'refresh-token-value' };
      mockAuthService.refreshToken.mockResolvedValue(mockTokens);

      const result = await controller.refreshToken(dto);

      expect(result).toBe(mockTokens);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        'refresh-token-value',
      );
    });

    it('should propagate UnauthorizedException from service', async () => {
      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      await expect(
        controller.refreshToken({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /auth/profile', () => {
    it('should call authService.getProfile with userId from @CurrentUser', async () => {
      const userId = 'current-user-id';
      const profile = {
        id: userId,
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        role: 'AGENT',
        isActive: true,
        createdAt: new Date(),
      };
      mockAuthService.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile(userId);

      expect(result).toBe(profile);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(userId);
    });

    it('should propagate UnauthorizedException from service', async () => {
      mockAuthService.getProfile.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      await expect(controller.getProfile('bad-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Guard and decorator verification', () => {
    it('should have @UseGuards(JwtAuthGuard) on getProfile', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        AuthController.prototype.getProfile,
      );
      expect(guards).toBeDefined();
      expect(guards.length).toBe(1);
    });

    it('should not have guards on register, login, refresh endpoints', () => {
      expect(
        Reflect.getMetadata('__guards__', AuthController.prototype.register),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata('__guards__', AuthController.prototype.login),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata('__guards__', AuthController.prototype.refreshToken),
      ).toBeUndefined();
    });

    it('should have @Public() metadata on register', () => {
      const isPublic = Reflect.getMetadata(
        'isPublic',
        AuthController.prototype.register,
      );
      expect(isPublic).toBe(true);
    });

    it('should have @Public() metadata on login', () => {
      const isPublic = Reflect.getMetadata(
        'isPublic',
        AuthController.prototype.login,
      );
      expect(isPublic).toBe(true);
    });

    it('should have @Public() metadata on refresh', () => {
      const isPublic = Reflect.getMetadata(
        'isPublic',
        AuthController.prototype.refreshToken,
      );
      expect(isPublic).toBe(true);
    });
  });
});
