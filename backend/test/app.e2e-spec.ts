import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppGateway } from '../src/modules/gateway/app.gateway';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, VisaStatus, AppointmentType, EntryType, NotificationType, AuditAction } from '@prisma/client';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Y7H7N7H7N7H7N7H7N7H7O'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockId = 'clxx1mock0000test000000001';
const mockId2 = 'clxx1mock0000test000000002';
const mockUserId = 'clxx1mock0000user00000001';
const mockToday = new Date('2026-06-27T10:00:00.000Z');
const mockDateStr = '2026-06-27T10:00:00.000Z';

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
  id: mockId,
  fullName: 'John Doe',
  phoneNumber: '+212600000001',
  whatsappNumber: '+212600000001',
  email: 'john@test.com',
  passportNumber: 'AB123456',
  nationality: 'Morocco',
  notes: 'Test client',
  createdBy: mockUserId,
  createdAt: mockToday,
  updatedAt: mockToday,
};

const mockCase = {
  id: mockId,
  caseNumber: 'VISA-2026-0001',
  clientId: mockId,
  visaCountry: 'France',
  visaType: 'Schengen',
  currentStatus: 'EN_ATTENTE' as VisaStatus,
  archived: false,
  openingDate: mockToday,
  notes: 'Test case',
  createdBy: mockUserId,
  createdAt: mockToday,
  updatedAt: mockToday,
};

const mockAppointment = {
  id: mockId,
  visaCaseId: mockId,
  appointmentDate: mockToday,
  appointmentTime: '10:00',
  appointmentCenter: 'VFS Casablanca',
  appointmentType: 'VFS' as AppointmentType,
  notes: 'Test appointment',
  userId: mockUserId,
  createdAt: mockToday,
  updatedAt: mockToday,
};

const mockVisaDetails = {
  id: mockId,
  visaCaseId: mockId,
  validFrom: new Date('2026-07-01'),
  validUntil: new Date('2027-07-01'),
  durationDays: 90,
  entryType: 'SINGLE' as EntryType,
  visaNumber: 'V123456',
  notes: 'Test visa',
  createdAt: mockToday,
  updatedAt: mockToday,
};

const mockNotification = {
  id: mockId,
  type: 'INFO' as NotificationType,
  title: 'Test Notification',
  message: 'This is a test',
  read: false,
  userId: mockUserId,
  link: '/visa-cases/' + mockId,
  createdAt: mockToday,
};

const mockBackup = {
  id: mockId,
  filename: 'hakimi-backup-2026-06-27-test.zip',
  size: 1024,
  status: 'completed',
  type: 'manual',
  createdById: mockUserId,
  createdAt: mockToday,
};

const mockSetting = {
  id: mockId,
  enabled: true,
  frequency: 'daily',
  time: '02:00',
  retentionDays: 30,
  maxBackups: 10,
  updatedAt: mockToday,
};

function createMockPrisma(): DeepMockProxy<PrismaClient> {
  const mock = mockDeep<PrismaClient>();

  (mock as any).$transaction.mockImplementation(async (args: any) => {
    if (Array.isArray(args)) {
      return Promise.all(args.map((x: any) => (typeof x === 'function' ? x() : x)));
    }
    if (typeof args === 'function') {
      return args(mock);
    }
    return [];
  });

  (mock as any).$queryRaw.mockResolvedValue([{ 1: 1 }]);

  return mock;
}

function configureAuthMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  mockPrisma.user.create.mockResolvedValue(mockUser);
  mockPrisma.refreshToken.findUnique.mockResolvedValue({
    id: mockId,
    token: 'mock-refresh-token',
    userId: mockUserId,
    user: mockUser,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: mockToday,
  });
  mockPrisma.refreshToken.create.mockResolvedValue({
    id: mockId,
    token: 'mock-refresh-token',
    userId: mockUserId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: mockToday,
  });
  mockPrisma.refreshToken.delete.mockResolvedValue({
    id: mockId,
    token: 'mock-refresh-token',
    userId: mockUserId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: mockToday,
  });
  mockPrisma.auditLog.create.mockResolvedValue({
    id: mockId,
    action: 'CREATE' as AuditAction,
    entity: 'User',
    entityId: mockUserId,
    metadata: {},
    userId: mockUserId,
    createdAt: mockToday,
  });
}

function configureClientMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.client.create.mockResolvedValue(mockClient);
  mockPrisma.client.findUnique.mockResolvedValue(mockClient);
  mockPrisma.client.findMany.mockResolvedValue([mockClient]);
  mockPrisma.client.count.mockResolvedValue(1);
  mockPrisma.client.update.mockResolvedValue(mockClient);
  mockPrisma.client.delete.mockResolvedValue(mockClient);
}

function configureVisaCaseMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.visaCase.findUnique.mockResolvedValue(mockCase);
  mockPrisma.visaCase.findMany.mockResolvedValue([mockCase]);
  mockPrisma.visaCase.findFirst.mockResolvedValue(mockCase);
  mockPrisma.visaCase.count.mockResolvedValue(1);
  mockPrisma.visaCase.create.mockResolvedValue(mockCase);
  mockPrisma.visaCase.update.mockResolvedValue(mockCase);
  mockPrisma.visaCase.delete.mockResolvedValue(mockCase);
  mockPrisma.statusHistory.create.mockResolvedValue({
    id: mockId,
    visaCaseId: mockId,
    oldStatus: 'EN_ATTENTE' as VisaStatus,
    newStatus: 'EN_TRAITEMENT' as VisaStatus,
    changedBy: mockUserId,
    changedAt: mockToday,
  });
  mockPrisma.statusHistory.findMany.mockResolvedValue([
    {
      id: mockId,
      visaCaseId: mockId,
      oldStatus: 'EN_ATTENTE' as VisaStatus,
      newStatus: 'EN_TRAITEMENT' as VisaStatus,
      changedBy: mockUserId,
      changedAt: mockToday,
      changer: { id: mockUserId, firstName: 'Admin', lastName: 'User' },
      visaCase: { caseNumber: 'VISA-2026-0001' },
    },
  ]);
}

function configureAppointmentMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.appointment.create.mockResolvedValue(mockAppointment);
  mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
  mockPrisma.appointment.findMany.mockResolvedValue([mockAppointment]);
  mockPrisma.appointment.update.mockResolvedValue(mockAppointment);
  mockPrisma.appointment.delete.mockResolvedValue(mockAppointment);
}

function configureVisaDetailsMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.visaDetails.findUnique.mockResolvedValue(mockVisaDetails);
  mockPrisma.visaDetails.create.mockResolvedValue(mockVisaDetails);
  mockPrisma.visaDetails.update.mockResolvedValue(mockVisaDetails);
  mockPrisma.visaDetails.delete.mockResolvedValue(mockVisaDetails);
}

function configureNotificationMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.notification.create.mockResolvedValue(mockNotification);
  mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);
  mockPrisma.notification.count.mockResolvedValue(1);
  mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.notification.deleteMany.mockResolvedValue({ count: 1 });
}

function configureBackupMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.backup.create.mockResolvedValue(mockBackup);
  mockPrisma.backup.findMany.mockResolvedValue([mockBackup]);
  mockPrisma.backup.findUnique.mockResolvedValue(mockBackup);
  mockPrisma.backup.delete.mockResolvedValue(mockBackup);
  mockPrisma.backupSettings.findFirst.mockResolvedValue(mockSetting);
  mockPrisma.backupSettings.create.mockResolvedValue(mockSetting);
  mockPrisma.backupSettings.update.mockResolvedValue(mockSetting);
}

function configureSearchMocks(mockPrisma: DeepMockProxy<PrismaClient>) {
  mockPrisma.client.findMany.mockResolvedValue([mockClient]);
  mockPrisma.visaCase.findMany.mockResolvedValue([mockCase]);
  mockPrisma.appointment.findMany.mockResolvedValue([mockAppointment]);
}

describe('App (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let authToken: string;
  let refreshTokenValue: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    configureAuthMocks(mockPrisma);
    configureClientMocks(mockPrisma);
    configureVisaCaseMocks(mockPrisma);
    configureAppointmentMocks(mockPrisma);
    configureVisaDetailsMocks(mockPrisma);
    configureNotificationMocks(mockPrisma);
    configureBackupMocks(mockPrisma);
    configureSearchMocks(mockPrisma);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma as unknown as PrismaService)
      .overrideProvider(AppGateway)
      .useValue({
        sendToUser: jest.fn().mockResolvedValue(undefined),
        broadcast: jest.fn().mockResolvedValue(undefined),
        handleConnection: jest.fn(),
        handleDisconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
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

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' })
      .expect(201);
    authToken = loginRes.body.data.accessToken;
    refreshTokenValue = loginRes.body.data.refreshToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authorization', () => {
    it('GET /api/clients should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/clients').expect(401);
    });

    it('POST /api/clients should return 401 without token', () => {
      return request(app.getHttpServer()).post('/api/clients').send({}).expect(401);
    });

    it('GET /api/visa-cases should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/visa-cases').expect(401);
    });

    it('GET /api/notifications should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/notifications').expect(401);
    });

    it('POST /api/backups should return 401 without token', () => {
      return request(app.getHttpServer()).post('/api/backups').expect(401);
    });

    it('GET /api/search should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/search?q=test').expect(401);
    });

    it('GET /api/health should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/health').expect(401);
    });
  });

  describe('Auth', () => {
    it('POST /api/auth/register should register a user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        ...mockUser,
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
      });
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe('newuser@test.com');
    });

    it('POST /api/auth/register should reject duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
        })
        .expect(409);
      expect(res.body.message).toContain('Email already registered');
    });

    it('POST /api/auth/register should validate input - empty fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'bad', password: 'short', firstName: '', lastName: '' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('POST /api/auth/login should login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(201);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('admin@test.com');
    });

    it('POST /api/auth/login should reject invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'unknown@test.com', password: 'wrong' })
        .expect(401);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('POST /api/auth/login should reject inactive account', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ ...mockUser, isActive: false });
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(401);
      expect(res.body.message).toContain('Account is inactive');
    });

    it('POST /api/auth/refresh should refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'mock-refresh-token' })
        .expect(201);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('POST /api/auth/refresh should reject expired token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce({
        id: mockId,
        token: 'expired',
        userId: mockUserId,
        user: mockUser,
        expiresAt: new Date('2020-01-01'),
        createdAt: mockToday,
      });
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'expired' })
        .expect(401);
      expect(res.body.message).toContain('Invalid or expired refresh token');
    });

    it('POST /api/auth/refresh should reject non-existent token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'nonexistent' })
        .expect(401);
      expect(res.body.message).toContain('Invalid or expired refresh token');
    });

    it('GET /api/auth/profile should return profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe('admin@test.com');
    });

    it('GET /api/auth/profile should return 401 without token', async () => {
      return request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });
  });

  describe('Clients', () => {
    it('POST /api/clients should create a client', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'John Doe',
          phoneNumber: '+212600000001',
          email: 'john@test.com',
          passportNumber: 'AB123456',
          nationality: 'Morocco',
        })
        .expect(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.fullName).toBe('John Doe');
    });

    it('POST /api/clients should reject validation - empty fullName', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fullName: '', phoneNumber: '' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('POST /api/clients should reject validation - missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('GET /api/clients should list clients with pagination', async () => {
      mockPrisma.client.findMany.mockResolvedValueOnce([mockClient]);
      mockPrisma.client.count.mockResolvedValueOnce(1);
      const res = await request(app.getHttpServer())
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('GET /api/clients should search clients', async () => {
      mockPrisma.client.findMany.mockResolvedValueOnce([mockClient]);
      mockPrisma.client.count.mockResolvedValueOnce(1);
      const res = await request(app.getHttpServer())
        .get('/api/clients?search=John')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.data.length).toBe(1);
    });

    it('GET /api/clients should paginate with custom page/limit', async () => {
      mockPrisma.client.findMany.mockResolvedValueOnce([]);
      mockPrisma.client.count.mockResolvedValueOnce(0);
      const res = await request(app.getHttpServer())
        .get('/api/clients?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.meta).toMatchObject({ page: 2, limit: 10, total: 0, totalPages: 0 });
    });

    it('GET /api/clients/:id should find one client', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/clients/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.id).toBe(mockId);
    });

    it('GET /api/clients/:id should return 404', async () => {
      mockPrisma.client.findUnique.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .get('/api/clients/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      expect(res.body.message).toContain('Client not found');
    });

    it('PATCH /api/clients/:id should update a client', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/clients/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fullName: 'Jane Doe' })
        .expect(200);
      expect(res.body.data).toBeDefined();
    });

    it('DELETE /api/clients/:id should remove a client', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/clients/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('GET /api/clients/dashboard should return stats', async () => {
      mockPrisma.client.count.mockResolvedValueOnce(10);
      mockPrisma.visaCase.count.mockResolvedValueOnce(25);
      const res = await request(app.getHttpServer())
        .get('/api/clients/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('totalClients');
      expect(res.body.data).toHaveProperty('totalCases');
    });

    it('GET /api/clients/analytics should return analytics', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([]);
      mockPrisma.visaCase.groupBy.mockResolvedValueOnce([]);
      mockPrisma.visaCase.groupBy.mockResolvedValueOnce([]);
      const res = await request(app.getHttpServer())
        .get('/api/clients/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('applicationsPerMonth');
      expect(res.body.data).toHaveProperty('topCountries');
      expect(res.body.data).toHaveProperty('statusDistribution');
    });

    it('GET /api/clients/:id/profile should return client profile', async () => {
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        ...mockClient,
        creator: { id: mockUserId, firstName: 'Admin', lastName: 'User' },
        visaCases: [{
          ...mockCase,
          statusHistories: [],
          appointments: [],
          visaDetails: null,
          _count: { visaCases: 1, internalNotes: 0 },
        }],
        _count: { visaCases: 1, internalNotes: 0 },
      });
      const res = await request(app.getHttpServer())
        .get(`/api/clients/${mockId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('creator');
      expect(res.body.data).toHaveProperty('visaCases');
    });

    it('GET /api/clients/:id/timeline should return timeline', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);
      mockPrisma.appointment.findMany.mockResolvedValueOnce([{
        ...mockAppointment,
        visaCase: { caseNumber: 'VISA-2026-0001' },
      }]);
      const res = await request(app.getHttpServer())
        .get(`/api/clients/${mockId}/timeline`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/clients/:id/stats should return stats', async () => {
      mockPrisma.visaCase.count.mockResolvedValue(3);
      mockPrisma.visaCase.groupBy.mockResolvedValueOnce([]);
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([]);
      mockPrisma.statusHistory.findMany.mockResolvedValueOnce([]);
      mockPrisma.appointment.findMany.mockResolvedValueOnce([]);
      const res = await request(app.getHttpServer())
        .get(`/api/clients/${mockId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('totalApplications');
    });

    it('GET /api/clients/:id/documents should return documents', async () => {
      mockPrisma.document.findMany.mockResolvedValueOnce([]);
      const res = await request(app.getHttpServer())
        .get(`/api/clients/${mockId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Visa Cases', () => {
    it('POST /api/visa-cases should create a visa case', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/visa-cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: mockId,
          visaCountry: 'France',
          visaType: 'Schengen',
        })
        .expect(201);
      expect(res.body.data).toHaveProperty('caseNumber');
    });

    it('POST /api/visa-cases should reject validation - missing fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/visa-cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clientId: '' })
        .expect(400);
    });

    it('GET /api/visa-cases should list with pagination', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([mockCase]);
      mockPrisma.visaCase.count.mockResolvedValueOnce(1);
      const res = await request(app.getHttpServer())
        .get('/api/visa-cases')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toMatchObject({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('GET /api/visa-cases should filter by status', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([mockCase]);
      mockPrisma.visaCase.count.mockResolvedValueOnce(1);
      const res = await request(app.getHttpServer())
        .get('/api/visa-cases?status=EN_ATTENTE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.data.length).toBe(1);
    });

    it('GET /api/visa-cases should search', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([mockCase]);
      mockPrisma.visaCase.count.mockResolvedValueOnce(1);
      const res = await request(app.getHttpServer())
        .get('/api/visa-cases?search=VISA')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.data.length).toBe(1);
    });

    it('GET /api/visa-cases/:id should find one', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/visa-cases/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.id).toBe(mockId);
    });

    it('GET /api/visa-cases/:id should return 404', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .get('/api/visa-cases/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      expect(res.body.message).toContain('Visa case not found');
    });

    it('PATCH /api/visa-cases/:id should update', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/visa-cases/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ visaCountry: 'Spain' })
        .expect(200);
      expect(res.body.data).toBeDefined();
    });

    it('PATCH /api/visa-cases/:id/status should change status', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValueOnce(mockCase);
      mockPrisma.visaCase.findUnique.mockResolvedValueOnce({
        ...mockCase,
        client: { fullName: 'John Doe' },
      });
      const res = await request(app.getHttpServer())
        .patch(`/api/visa-cases/${mockId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'EN_TRAITEMENT' })
        .expect(200);
      expect(res.body.data.currentStatus).toBeDefined();
    });

    it('PATCH /api/visa-cases/:id/status should reject invalid status enum', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/visa-cases/${mockId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('GET /api/visa-cases/:id/history should return history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/visa-cases/${mockId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('DELETE /api/visa-cases/:id should remove', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/visa-cases/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Appointments', () => {
    it('POST /api/appointments should create', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          visaCaseId: mockId,
          appointmentDate: '2026-07-15T10:00:00.000Z',
          appointmentTime: '10:00',
          appointmentCenter: 'VFS Casablanca',
          appointmentType: 'VFS',
        })
        .expect(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('POST /api/appointments should reject validation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ visaCaseId: '' })
        .expect(400);
    });

    it('GET /api/appointments should list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/appointments should filter by date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/appointments?dateFrom=2026-01-01&dateTo=2026-12-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/appointments should filter by type', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/appointments?appointmentType=VFS')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/appointments/:id should find one', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/appointments/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.id).toBe(mockId);
    });

    it('GET /api/appointments/:id should return 404', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .get('/api/appointments/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      expect(res.body.message).toContain('Appointment not found');
    });

    it('PATCH /api/appointments/:id should update', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/appointments/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ appointmentCenter: 'TLS Rabat' })
        .expect(200);
      expect(res.body.data).toBeDefined();
    });

    it('DELETE /api/appointments/:id should remove', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/appointments/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Visa Details', () => {
    const visaDetailsUrl = `/api/visa-cases/${mockId}/visa-details`;

    it('POST should create visa details', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValueOnce({ ...mockCase, currentStatus: 'VISA_OK' as VisaStatus });
      mockPrisma.visaDetails.findUnique.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .post(visaDetailsUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          validFrom: '2026-07-01',
          validUntil: '2027-07-01',
          durationDays: 90,
          entryType: 'SINGLE',
          visaNumber: 'V123456',
        })
        .expect(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('POST should reject when status is not VISA_OK', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValueOnce(mockCase);
      const res = await request(app.getHttpServer())
        .post(visaDetailsUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          validFrom: '2026-07-01',
          validUntil: '2027-07-01',
          durationDays: 90,
          entryType: 'SINGLE',
        })
        .expect(400);
    });

    it('POST should reject when details already exist', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValueOnce({ ...mockCase, currentStatus: 'VISA_OK' as VisaStatus });
      mockPrisma.visaDetails.findUnique.mockResolvedValueOnce(mockVisaDetails);
      const res = await request(app.getHttpServer())
        .post(visaDetailsUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          validFrom: '2026-07-01',
          validUntil: '2027-07-01',
          durationDays: 90,
          entryType: 'SINGLE',
        })
        .expect(400);
    });

    it('GET should find by visa case', async () => {
      const res = await request(app.getHttpServer())
        .get(visaDetailsUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('visaCaseId');
    });

    it('PATCH should update visa details', async () => {
      const res = await request(app.getHttpServer())
        .patch(visaDetailsUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ durationDays: 180 })
        .expect(200);
      expect(res.body.data).toBeDefined();
    });

    it('DELETE should remove visa details', async () => {
      const res = await request(app.getHttpServer())
        .delete(visaDetailsUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Notifications', () => {
    it('POST /api/notifications should create', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INFO',
          title: 'Test Notification',
          message: 'Hello',
          userId: mockUserId,
        })
        .expect(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('POST /api/notifications should reject validation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'INVALID' })
        .expect(400);
    });

    it('GET /api/notifications should list with pagination and meta', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toHaveProperty('unreadCount');
      expect(res.body.data.meta).toMatchObject({
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
        totalPages: expect.any(Number),
        unreadCount: expect.any(Number),
      });
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('GET /api/notifications should filter by read status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications?read=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /api/notifications/unread-count should return count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toEqual(expect.any(Number));
    });

    it('PATCH /api/notifications/:id/read should mark as read', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/notifications/${mockId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('PATCH /api/notifications/read-all should mark all as read', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('DELETE /api/notifications/:id should remove', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/notifications/${mockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Bulk Operations', () => {
    it('POST /api/bulk/status-change should return BulkResult', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([mockCase]);
      mockPrisma.client.findMany.mockResolvedValueOnce([mockClient]);
      const res = await request(app.getHttpServer())
        .post('/api/bulk/status-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [mockId], status: 'EN_TRAITEMENT' })
        .expect(201);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('successful');
      expect(res.body.data).toHaveProperty('failed');
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('POST /api/bulk/status-change should reject validation', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([]);
      const res = await request(app.getHttpServer())
        .post('/api/bulk/status-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [], status: 'EN_TRAITEMENT' })
        .expect(400);
    });

    it('POST /api/bulk/status-change should reject no valid cases', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([]);
      const res = await request(app.getHttpServer())
        .post('/api/bulk/status-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: ['nonexistent'], status: 'EN_TRAITEMENT' })
        .expect(400);
    });

    it('POST /api/bulk/appointment should create bulk appointments', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([mockCase]);
      const res = await request(app.getHttpServer())
        .post('/api/bulk/appointment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ids: [mockId],
          appointmentDate: '2026-07-15',
          appointmentTime: '10:00',
          appointmentCenter: 'VFS Casablanca',
          appointmentType: 'VFS',
        })
        .expect(201);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('items');
    });

    it('POST /api/bulk/archive should return BulkResult', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([mockCase]);
      const res = await request(app.getHttpServer())
        .post('/api/bulk/archive')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [mockId] })
        .expect(201);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('successful');
      expect(res.body.data).toHaveProperty('items');
    });

    it('POST /api/bulk/restore should return BulkResult', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([mockCase]);
      const res = await request(app.getHttpServer())
        .post('/api/bulk/restore')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [mockId] })
        .expect(201);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('successful');
    });

    it('POST /api/bulk/delete should return BulkResult', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([mockCase]);
      const res = await request(app.getHttpServer())
        .post('/api/bulk/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [mockId] })
        .expect(201);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('successful');
    });

    it('POST /api/bulk/archive should reject no valid cases', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([]);
      const res = await request(app.getHttpServer())
        .post('/api/bulk/archive')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: ['nonexistent'] })
        .expect(400);
    });
  });

  describe('Health', () => {
    it('GET /api/health (with auth) should return check result', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('database');
      expect(res.body.data).toHaveProperty('nodeVersion');
      expect(res.body.data).toHaveProperty('environment');
    });

    it('GET /api/health (no auth) should return 401', async () => {
      return request(app.getHttpServer()).get('/api/health').expect(401);
    });

    it('GET /api/health/live should return ok (public)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200);
      expect(res.body.data.status).toBe('ok');
    });

    it('GET /api/health/ready should return status (public)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(200);
      expect(res.body.data).toHaveProperty('database');
    });
  });

  describe('Tracking (public)', () => {
    it('GET /api/tracking?phone=xxx should find cases by phone', async () => {
      mockPrisma.client.findFirst.mockResolvedValueOnce({ id: mockId, fullName: 'John Doe' });
      const res = await request(app.getHttpServer())
        .get('/api/tracking?phone=%2B212600000001')
        .expect(200);
      expect(res.body.data).toHaveProperty('clientName');
      expect(res.body.data).toHaveProperty('cases');
      expect(res.body.data).toHaveProperty('total');
    });

    it('GET /api/tracking?phone=xxx should return 404 for unknown phone', async () => {
      mockPrisma.client.findFirst.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .get('/api/tracking?phone=0000000000')
        .expect(404);
    });

    it('GET /api/tracking/:id should return public case details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/tracking/${mockId}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('caseNumber');
    });

    it('GET /api/tracking/:id should return 404 for unknown case', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .get('/api/tracking/nonexistent')
        .expect(404);
    });
  });

  describe('Search', () => {
    it('GET /api/search?q=xxx should return global search results', async () => {
      mockPrisma.client.findMany.mockResolvedValueOnce([mockClient]);
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([{
        ...mockCase,
        client: { fullName: 'John Doe' },
      }]);
      mockPrisma.appointment.findMany.mockResolvedValueOnce([{
        ...mockAppointment,
        visaCase: {
          caseNumber: 'VISA-2026-0001',
          client: { fullName: 'John Doe' },
        },
      }]);
      const res = await request(app.getHttpServer())
        .get('/api/search?q=John')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty('clients');
      expect(res.body.data).toHaveProperty('visaCases');
      expect(res.body.data).toHaveProperty('appointments');
    });

    it('GET /api/search without q should return empty results', async () => {
      mockPrisma.client.findMany.mockResolvedValueOnce([]);
      mockPrisma.visaCase.findMany.mockResolvedValueOnce([]);
      mockPrisma.appointment.findMany.mockResolvedValueOnce([]);
      const res = await request(app.getHttpServer())
        .get('/api/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.clients).toEqual([]);
      expect(res.body.data.visaCases).toEqual([]);
      expect(res.body.data.appointments).toEqual([]);
    });
  });
});
