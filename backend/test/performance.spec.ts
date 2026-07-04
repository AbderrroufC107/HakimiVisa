import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient, AuditAction } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { generateMockVisaCases, measureTime } from './performance.helpers';

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

let authToken: string;

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
  mockPrisma.visaCase.create.mockResolvedValue({
    id: 'vc-1',
    caseNumber: 'VISA-2026-0001',
    clientId: 'client-1',
    visaCountry: 'France',
    visaType: 'Schengen',
    currentStatus: 'EN_ATTENTE',
    archived: false,
    openingDate: mockToday,
    notes: null,
    createdBy: mockUserId,
    createdAt: mockToday,
    updatedAt: mockToday,
  });
}

async function createApp(mockPrisma: DeepMockProxy<PrismaClient>): Promise<INestApplication> {
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

describe('Performance Tests', () => {
  let app: INestApplication;
  let mockPrisma: DeepMockProxy<PrismaClient>;

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

  describe('Response Time for Listing Visa Cases', () => {
    const sizes = [100, 500, 1000, 5000];

    sizes.forEach((size) => {
      it(`should list ${size} visa cases in under 500ms`, async () => {
        configureBaseMocks(mockPrisma);
        const mockCases = generateMockVisaCases(size);
        mockPrisma.visaCase.findMany.mockResolvedValue(mockCases as any);
        mockPrisma.visaCase.count.mockResolvedValue(size);

        const [, elapsed] = await measureTime(() =>
          request(app.getHttpServer())
            .get('/api/visa-cases')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        );

        expect(elapsed).toBeLessThan(500);
      });
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle 10 simultaneous requests successfully', async () => {
      configureBaseMocks(mockPrisma);
      mockPrisma.visaCase.findMany.mockResolvedValue(generateMockVisaCases(20) as any);
      mockPrisma.visaCase.count.mockResolvedValue(20);

      const concurrentRequests = 10;
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/api/visa-cases')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
      );

      const [, elapsed] = await measureTime(() => Promise.all(promises));
      const responses = await Promise.all(promises);

      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data).toBeDefined();
      });

      expect(elapsed).toBeLessThan(2000);
    });
  });

  describe('Bulk Status Change', () => {
    it('should process bulk status change for 1000 items', async () => {
      configureBaseMocks(mockPrisma);
      const mockCases = generateMockVisaCases(1000);
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases as any);
      mockPrisma.visaCase.update.mockResolvedValue({
        id: 'vc-1',
        caseNumber: 'VISA-2026-0001',
        clientId: 'client-1',
        visaCountry: 'France',
        visaType: 'Schengen',
        currentStatus: 'EN_TRAITEMENT',
        archived: false,
        openingDate: mockToday,
        notes: null,
        createdBy: mockUserId,
        createdAt: mockToday,
        updatedAt: mockToday,
      });

      mockPrisma.client.findMany.mockResolvedValue(
        mockCases.map((c) => ({
          id: c.clientId,
          fullName: 'Client Name',
          phoneNumber: '+212600000000',
          email: 'client@test.com',
          passportNumber: 'AB123456',
          nationality: 'Morocco',
          notes: null,
          createdBy: mockUserId,
          createdAt: mockToday,
          updatedAt: mockToday,
        })),
      );

      const ids = mockCases.map((c) => c.id);

      const [, elapsed] = await measureTime(() =>
        request(app.getHttpServer())
          .post('/api/bulk/status-change')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ids, status: 'EN_TRAITEMENT' })
          .expect(201),
      );

      expect(elapsed).toBeLessThan(2000);
    });
  });

  describe('Mock Call Count Verification', () => {
    it('should track Prisma call counts for findMany', async () => {
      configureBaseMocks(mockPrisma);
      mockPrisma.visaCase.findMany.mockClear();
      mockPrisma.visaCase.count.mockClear();

      const mockCases = generateMockVisaCases(50);
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases as any);
      mockPrisma.visaCase.count.mockResolvedValue(50);

      await request(app.getHttpServer())
        .get('/api/visa-cases')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(mockPrisma.visaCase.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.visaCase.count).toHaveBeenCalledTimes(1);
    });

    it('should not make excessive Prisma calls during listing', async () => {
      configureBaseMocks(mockPrisma);
      mockPrisma.visaCase.findMany.mockClear();
      mockPrisma.visaCase.count.mockClear();
      mockPrisma.client.findMany.mockClear();
      mockPrisma.client.count.mockClear();

      const mockCases = generateMockVisaCases(10);
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases as any);
      mockPrisma.visaCase.count.mockResolvedValue(10);

      const totalDbCallsBefore =
        mockPrisma.visaCase.findMany.mock.calls.length +
        mockPrisma.visaCase.count.mock.calls.length +
        mockPrisma.client.findMany.mock.calls.length +
        mockPrisma.client.count.mock.calls.length;

      await request(app.getHttpServer())
        .get('/api/visa-cases')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const totalDbCallsAfter =
        mockPrisma.visaCase.findMany.mock.calls.length +
        mockPrisma.visaCase.count.mock.calls.length +
        mockPrisma.client.findMany.mock.calls.length +
        mockPrisma.client.count.mock.calls.length;

      const newCalls = totalDbCallsAfter - totalDbCallsBefore;
      expect(newCalls).toBeLessThanOrEqual(2);
    });
  });
});
