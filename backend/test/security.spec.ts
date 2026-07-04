import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient, AuditAction } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { createInvalidToken, createExpiredToken } from './security.helpers';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Y7H7N7H7N7H7N7H7N7H7O'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/modules/gateway/app.gateway', () => ({
  AppGateway: jest.fn().mockImplementation(() => ({
    sendToUser: jest.fn(),
    broadcast: jest.fn(),
    handleConnection: jest.fn(),
    handleDisconnect: jest.fn(),
  })),
}));

const mockUserId = 'mock-user-id';
const mockToday = new Date('2026-06-27T10:00:00.000Z');

const mockUser = {
  id: mockUserId,
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  isActive: true,
  createdAt: mockToday,
  password: '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Y7H7N7H7N7H7N7H7N7H7O',
};

const mockClient = {
  id: 'client-1',
  fullName: 'John Doe',
  phoneNumber: '+212600000001',
  email: 'john@test.com',
  passportNumber: 'AB123456',
  nationality: 'Morocco',
  notes: 'Test client',
  createdBy: mockUserId,
  createdAt: mockToday,
  updatedAt: mockToday,
};

const mockVisaCase = {
  id: 'vc-1',
  caseNumber: 'VISA-2026-0001',
  clientId: 'client-1',
  visaCountry: 'France',
  visaType: 'Schengen',
  currentStatus: 'EN_ATTENTE',
  archived: false,
  openingDate: mockToday,
  notes: 'Test case',
  createdBy: mockUserId,
  createdAt: mockToday,
  updatedAt: mockToday,
};

function configureBaseMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  mockPrisma.user.create.mockResolvedValue(mockUser);
  mockPrisma.refreshToken.findUnique.mockResolvedValue({
    id: 'rt-1',
    token: 'mock-refresh-token',
    userId: mockUserId,
    user: mockUser,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: mockToday,
  });
  mockPrisma.refreshToken.create.mockResolvedValue({
    id: 'rt-1',
    token: 'mock-refresh-token',
    userId: mockUserId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: mockToday,
  });
  mockPrisma.refreshToken.delete.mockResolvedValue({
    id: 'rt-1',
    token: 'mock-refresh-token',
    userId: mockUserId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: mockToday,
  });
  mockPrisma.auditLog.create.mockResolvedValue({
    id: 'al-1',
    action: 'CREATE' as AuditAction,
    entity: 'User',
    entityId: mockUserId,
    metadata: {},
    userId: mockUserId,
    createdAt: mockToday,
  });
  mockPrisma.client.create.mockResolvedValue(mockClient);
  mockPrisma.client.findUnique.mockResolvedValue(mockClient);
  mockPrisma.client.findMany.mockResolvedValue([mockClient]);
  mockPrisma.client.count.mockResolvedValue(1);
  mockPrisma.client.update.mockResolvedValue(mockClient);
  mockPrisma.client.delete.mockResolvedValue(mockClient);
  mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
  mockPrisma.visaCase.findMany.mockResolvedValue([mockVisaCase]);
  mockPrisma.visaCase.findFirst.mockResolvedValue(mockVisaCase);
  mockPrisma.visaCase.count.mockResolvedValue(1);
  mockPrisma.visaCase.create.mockResolvedValue(mockVisaCase);
  mockPrisma.visaCase.update.mockResolvedValue(mockVisaCase);
  mockPrisma.visaCase.delete.mockResolvedValue(mockVisaCase);
}

function createMockPrisma(mockPrisma: DeepMockProxy<PrismaClient>): void {
  (mockPrisma as any).$transaction = jest.fn().mockImplementation(async (args: any) => {
    if (Array.isArray(args)) {
      return Promise.all(args.map((x: any) => (typeof x === 'function' ? x() : x)));
    }
    if (typeof args === 'function') {
      return args(mockPrisma);
    }
    return [];
  });
  (mockPrisma as any).$queryRaw = jest.fn().mockResolvedValue([{ 1: 1 }]);
}

async function createApp(mockPrisma: DeepMockProxy<PrismaClient>): Promise<INestApplication> {
  createMockPrisma(mockPrisma);
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma as unknown as PrismaService)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}

describe('Security Tests', () => {
  let app: INestApplication;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let authToken: string;

  beforeAll(async () => {
    mockPrisma = mockDeep<PrismaClient>();
    configureBaseMocks(mockPrisma);
    app = await createApp(mockPrisma);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' })
      .expect(201);
    authToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT Authentication', () => {
    it('should return 401 for invalid JWT token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/clients')
        .set('Authorization', `Bearer ${createInvalidToken()}`)
        .expect(401);
      expect(res.body.message).toBeDefined();
    });

    it('should return 401 for expired JWT token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/clients')
        .set('Authorization', `Bearer ${createExpiredToken()}`)
        .expect(401);
      expect(res.body.message).toBeDefined();
    });

    it('should return 401 for missing JWT token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/clients')
        .expect(401);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('SQL Injection', () => {
    it('should safely handle SQL injection in search parameter', async () => {
      configureBaseMocks(mockPrisma);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.visaCase.findMany.mockResolvedValue([]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      const injections = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users; --",
        "1; SELECT * FROM users WHERE 'a'='a",
        "admin'--",
        "'; EXEC xp_cmdshell('dir'); --",
      ];
      for (const sql of injections) {
        const res = await request(app.getHttpServer())
          .get(`/api/search?q=${encodeURIComponent(sql)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        expect(res.body.data).toBeDefined();
      }
    });

    it('should safely handle SQL injection in search without crashing', async () => {
      configureBaseMocks(mockPrisma);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.visaCase.findMany.mockResolvedValue([]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      const dangerous = "' OR 1=1; SELECT * FROM users; --";
      const res = await request(app.getHttpServer())
        .get(`/api/search?q=${encodeURIComponent(dangerous)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data.clients)).toBe(true);
      expect(Array.isArray(res.body.data.visaCases)).toBe(true);
      expect(Array.isArray(res.body.data.appointments)).toBe(true);
    });
  });

  describe('XSS Protection', () => {
    it('should store XSS payloads as-is in client fullName', async () => {
      configureBaseMocks(mockPrisma);
      const xssPayload = '<script>alert("XSS")</script>';
      const clientWithXss = { ...mockClient, fullName: xssPayload };
      mockPrisma.client.create.mockResolvedValue(clientWithXss);

      const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: xssPayload,
          phoneNumber: '+212600000001',
          email: 'xss@test.com',
          passportNumber: 'XS123456',
          nationality: 'Morocco',
        })
        .expect(201);
      expect(res.body.data.fullName).toBe(xssPayload);
    });

    it('should store XSS payloads as-is in notes fields', async () => {
      configureBaseMocks(mockPrisma);
      const xssPayload = '<img src=x onerror=alert(1)>';
      const notesWithXss = { ...mockClient, notes: xssPayload };
      mockPrisma.client.create.mockResolvedValue(notesWithXss);

      const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'XSS Client',
          phoneNumber: '+212600000002',
          email: 'xss2@test.com',
          passportNumber: 'XS789012',
          nationality: 'Morocco',
          notes: xssPayload,
        })
        .expect(201);
      expect(res.body.data.notes).toBe(xssPayload);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has required role', () => {
      const reflector = new Reflector();
      const guard = new RolesGuard(reflector);
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'ADMIN' } }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should deny access when user lacks required role', () => {
      const reflector = new Reflector();
      const guard = new RolesGuard(reflector);
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'AGENT' } }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      expect(guard.canActivate(mockContext)).toBe(false);
    });

    it('should allow access when no roles are required', () => {
      const reflector = new Reflector();
      const guard = new RolesGuard(reflector);
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'VIEWER' } }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should deny access when user has no role', () => {
      const reflector = new Reflector();
      const guard = new RolesGuard(reflector);
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: {} }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      expect(guard.canActivate(mockContext)).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 after exceeding rate limit', async () => {
      configureBaseMocks(mockPrisma);
      const publicEndpoint = '/api/health/live';
      const requestCount = 101;
      const results: number[] = [];

      for (let i = 0; i < requestCount; i++) {
        const res = await request(app.getHttpServer()).get(publicEndpoint);
        results.push(res.status);
      }

      const okCount = results.filter((s) => s === 200).length;
      const tooManyCount = results.filter((s) => s === 429).length;

      expect(okCount).toBe(100);
      expect(tooManyCount).toBe(1);
      expect(results[100]).toBe(429);
    });
  });
});
