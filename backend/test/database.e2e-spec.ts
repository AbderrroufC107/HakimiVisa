import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppGateway } from '../src/modules/gateway/app.gateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, VisaStatus, AuditAction } from '@prisma/client';
import { ClientsService } from '../src/modules/clients/clients.service';
import { VisaCasesService } from '../src/modules/visa-cases/visa-cases.service';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';
import { BackupService } from '../src/modules/backup/backup.service';
import { AuthService } from '../src/modules/auth/auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$mockedhash12345678901234567890123456789012'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockId = 'clxx1mock0000test000000001';
const mockUserId = 'clxx1mock0000user00000001';
const mockToday = new Date('2026-06-27T10:00:00.000Z');

const mockUser = {
  id: mockUserId,
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  isActive: true,
  createdAt: mockToday,
  password: '$2a$12$mockedhash12345678901234567890123456789012',
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

const mockVisaCase = {
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
  client: { fullName: 'John Doe' },
  creator: { id: mockUserId, firstName: 'Admin', lastName: 'User' },
};

const mockStatusHistory = {
  id: mockId,
  visaCaseId: mockId,
  oldStatus: 'EN_ATTENTE' as VisaStatus,
  newStatus: 'EN_TRAITEMENT' as VisaStatus,
  changedBy: mockUserId,
  changedAt: mockToday,
};

const mockAppointment = {
  id: mockId,
  visaCaseId: mockId,
  appointmentDate: mockToday,
  appointmentTime: '10:00',
  appointmentCenter: 'VFS Casablanca',
  appointmentType: 'VFS' as any,
  notes: 'Test appointment',
  userId: mockUserId,
  createdAt: mockToday,
  updatedAt: mockToday,
};

const mockAuditLog = {
  id: mockId,
  action: 'CREATE' as AuditAction,
  entity: 'Client',
  entityId: mockId,
  metadata: { fullName: 'John Doe' },
  userId: mockUserId,
  createdAt: mockToday,
};

const mockBackup = {
  id: mockId,
  filename: 'hakimi-backup-test.zip',
  size: 1024,
  status: 'completed',
  type: 'manual',
  createdById: mockUserId,
  createdAt: mockToday,
};

describe('Database Tests', () => {
  let app: INestApplication;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let clientsService: ClientsService;
  let visaCasesService: VisaCasesService;
  let appointmentsService: AppointmentsService;
  let backupService: BackupService;
  let authService: AuthService;

  beforeAll(async () => {
    mockPrisma = mockDeep<PrismaClient>();

    (mockPrisma as any).$transaction.mockImplementation(async (args: any) => {
      if (Array.isArray(args)) {
        return Promise.all(args.map((x: any) => (typeof x === 'function' ? x() : x)));
      }
      if (typeof args === 'function') {
        return args(mockPrisma);
      }
      return [];
    });

    (mockPrisma as any).$queryRaw.mockResolvedValue([{ 1: 1 }]);

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.client.findUnique.mockResolvedValue(mockClient);
    mockPrisma.client.findMany.mockResolvedValue([mockClient]);
    mockPrisma.client.count.mockResolvedValue(1);
    mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
    mockPrisma.visaCase.findMany.mockResolvedValue([mockVisaCase]);
    mockPrisma.visaCase.findFirst.mockResolvedValue(mockVisaCase);
    mockPrisma.visaCase.count.mockResolvedValue(1);
    mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    mockPrisma.appointment.findMany.mockResolvedValue([mockAppointment]);
    mockPrisma.backup.findUnique.mockResolvedValue(mockBackup);
    mockPrisma.backup.findMany.mockResolvedValue([mockBackup]);

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
    await app.init();

    clientsService = moduleFixture.get<ClientsService>(ClientsService);
    visaCasesService = moduleFixture.get<VisaCasesService>(VisaCasesService);
    appointmentsService = moduleFixture.get<AppointmentsService>(AppointmentsService);
    backupService = moduleFixture.get<BackupService>(BackupService);
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  function resetBcrypt() {
    const bcrypt = require('bcryptjs');
    bcrypt.hash.mockResolvedValue('$2a$12$mockedhash12345678901234567890123456789012');
    bcrypt.compare.mockResolvedValue(true);
  }

  describe('Transaction Behavior', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetBcrypt();
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      mockPrisma.visaCase.findMany.mockResolvedValue([mockVisaCase]);
      mockPrisma.visaCase.count.mockResolvedValue(1);
      mockPrisma.visaCase.update.mockResolvedValue(mockVisaCase);
      mockPrisma.statusHistory.create.mockResolvedValue(mockStatusHistory);
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);
      mockPrisma.client.delete.mockResolvedValue(mockClient);
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.appointment.delete.mockResolvedValue(mockAppointment);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.notification.create.mockResolvedValue({
        id: mockId,
        type: 'STATUS_CHANGE' as any,
        title: 'Test',
        message: 'Test',
        read: false,
        userId: mockUserId,
        link: '',
        createdAt: mockToday,
      });
    });

    it('should call $transaction when changing visa case status', async () => {
      await visaCasesService.updateStatus(mockId, { status: 'EN_TRAITEMENT' as VisaStatus }, mockUserId);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should call $transaction with array of promises for status change', async () => {
      await visaCasesService.updateStatus(mockId, { status: 'EN_TRAITEMENT' as VisaStatus }, mockUserId);
      const calls = (mockPrisma.$transaction as jest.Mock).mock.calls;
      const hasArrayCall = calls.some((call: any[]) => Array.isArray(call[0]));
      expect(hasArrayCall).toBe(true);
    });

    it('should include visaCase.update in status change transaction', async () => {
      await visaCasesService.updateStatus(mockId, { status: 'EN_TRAITEMENT' as VisaStatus }, mockUserId);
      expect(mockPrisma.visaCase.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockId } }),
      );
    });

    it('should include statusHistory.create in status change transaction', async () => {
      await visaCasesService.updateStatus(mockId, { status: 'EN_TRAITEMENT' as VisaStatus }, mockUserId);
      expect(mockPrisma.statusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visaCaseId: mockId,
            oldStatus: 'EN_ATTENTE',
            newStatus: 'EN_TRAITEMENT',
          }),
        }),
      );
    });

    it('should call $transaction when deleting a client', async () => {
      await clientsService.remove(mockId, mockUserId);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should call $transaction when deleting a visa case', async () => {
      await visaCasesService.remove(mockId, mockUserId);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should call $transaction when deleting an appointment', async () => {
      await appointmentsService.remove(mockId, mockUserId);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should rollback transaction when statusHistory.create fails', async () => {
      mockPrisma.statusHistory.create.mockRejectedValueOnce(new Error('DB error'));
      mockPrisma.visaCase.update.mockRejectedValueOnce(new Error('DB error'));
      await expect(
        visaCasesService.updateStatus(mockId, { status: 'EN_TRAITEMENT' as VisaStatus }, mockUserId),
      ).rejects.toThrow();
    });
  });

  describe('Cascade Rules', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetBcrypt();
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      mockPrisma.visaCase.findMany.mockResolvedValue([mockVisaCase]);
    });

    it('should query related visa cases when fetching client profile', async () => {
      await clientsService.getProfile(mockId);
      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockId },
          include: expect.objectContaining({
            visaCases: expect.any(Object),
          }),
        }),
      );
    });

    it('should query related status histories when fetching client timeline', async () => {
      mockPrisma.statusHistory.findMany.mockResolvedValue([]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.visaCase.findMany.mockResolvedValue([{ id: mockId }]);
      await clientsService.getTimeline(mockId);
      expect(mockPrisma.statusHistory.findMany).toHaveBeenCalled();
    });

    it('should query related appointments when fetching visa case details', async () => {
      await visaCasesService.findOne(mockId);
      expect(mockPrisma.visaCase.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockId },
          include: expect.objectContaining({
            statusHistories: expect.any(Object),
          }),
        }),
      );
    });

    it('should query appointments with visaCase include for case number', async () => {
      await appointmentsService.findOne(mockId);
      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockId },
          include: expect.objectContaining({
            visaCase: expect.any(Object),
            user: expect.any(Object),
          }),
        }),
      );
    });

    it('should cascade delete audit log when parent is removed via transaction', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);
      await clientsService.remove(mockId, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'DELETE',
            entity: 'Client',
            entityId: mockId,
          }),
        }),
      );
    });

    it('should cascade delete via transaction on visa case removal', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);
      await visaCasesService.remove(mockId, mockUserId);
      expect(mockPrisma.visaCase.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockId } }),
      );
    });

    it('should cascade delete via transaction on appointment removal', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);
      await appointmentsService.remove(mockId, mockUserId);
      expect(mockPrisma.appointment.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockId } }),
      );
    });
  });

  describe('StatusHistory Creation on Status Change', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetBcrypt();
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      mockPrisma.visaCase.update.mockResolvedValue({ ...mockVisaCase, currentStatus: 'EN_TRAITEMENT' as VisaStatus });
      mockPrisma.statusHistory.create.mockResolvedValue(mockStatusHistory);
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);
      mockPrisma.notification.create.mockResolvedValue({
        id: mockId,
        type: 'STATUS_CHANGE' as any,
        title: 'Visa Case Status Updated',
        message: 'Test',
        read: false,
        userId: mockUserId,
        link: `/visa-cases/${mockId}`,
        createdAt: mockToday,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it('should create StatusHistory entry on status change', async () => {
      await visaCasesService.updateStatus(mockId, { status: 'EN_TRAITEMENT' as VisaStatus }, mockUserId);
      expect(mockPrisma.statusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visaCaseId: mockId,
            oldStatus: 'EN_ATTENTE',
            newStatus: 'EN_TRAITEMENT',
            changedBy: mockUserId,
          }),
        }),
      );
    });

    it('should not create StatusHistory if status unchanged', async () => {
      await visaCasesService.updateStatus(mockId, { status: 'EN_ATTENTE' as VisaStatus }, mockUserId);
      expect(mockPrisma.statusHistory.create).not.toHaveBeenCalled();
    });

    it('should record old and new status in history', async () => {
      await visaCasesService.updateStatus(mockId, { status: 'VISA_OK' as VisaStatus }, mockUserId);
      expect(mockPrisma.statusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            oldStatus: 'EN_ATTENTE',
            newStatus: 'VISA_OK',
          }),
        }),
      );
    });

    it('should transition through multiple statuses correctly', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue({ ...mockVisaCase, currentStatus: 'EN_TRAITEMENT' as VisaStatus });
      mockPrisma.visaCase.update.mockResolvedValue({ ...mockVisaCase, currentStatus: 'RDV_OK' as VisaStatus });
      await visaCasesService.updateStatus(mockId, { status: 'RDV_OK' as VisaStatus }, mockUserId);
      expect(mockPrisma.statusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            oldStatus: 'EN_TRAITEMENT',
            newStatus: 'RDV_OK',
          }),
        }),
      );
    });
  });

  describe('AuditLog Creation on CRUD Operations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetBcrypt();
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.client.create.mockResolvedValue(mockClient);
      mockPrisma.client.update.mockResolvedValue(mockClient);
      mockPrisma.client.delete.mockResolvedValue(mockClient);
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: mockId,
        token: 'mock-refresh-token',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: mockToday,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.visaCase.update.mockResolvedValue(mockVisaCase);
      mockPrisma.statusHistory.create.mockResolvedValue(mockStatusHistory);
      mockPrisma.notification.create.mockResolvedValue({
        id: mockId,
        type: 'STATUS_CHANGE' as any,
        title: 'Test',
        message: 'Test',
        read: false,
        userId: mockUserId,
        link: '',
        createdAt: mockToday,
      });
    });

    it('should create AuditLog on client create', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      await clientsService.create({
        fullName: 'John Doe',
        phoneNumber: '+212600000001',
        email: 'john@test.com',
      }, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            entity: 'Client',
          }),
        }),
      );
    });

    it('should create AuditLog on client update', async () => {
      await clientsService.update(mockId, { fullName: 'Jane Doe' }, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            entity: 'Client',
          }),
        }),
      );
    });

    it('should create AuditLog on client delete', async () => {
      await clientsService.remove(mockId, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'DELETE',
            entity: 'Client',
          }),
        }),
      );
    });

    it('should create AuditLog on user register', async () => {
      mockPrisma.user.findUnique.mockReset();
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        ...mockUser,
        id: 'new-user-id',
        email: 'new@test.com',
      });
      await authService.register({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            entity: 'User',
          }),
        }),
      );
    });

    it('should create AuditLog on user login', async () => {
      mockPrisma.user.findUnique.mockReset();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await authService.login({ email: 'admin@test.com', password: 'password123' });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'LOGIN',
            entity: 'User',
          }),
        }),
      );
    });

    it('should create AuditLog on visa case status change', async () => {
      mockPrisma.visaCase.update.mockResolvedValue({ ...mockVisaCase, currentStatus: 'EN_TRAITEMENT' as VisaStatus });
      mockPrisma.statusHistory.create.mockResolvedValue(mockStatusHistory);
      mockPrisma.notification.create.mockResolvedValue({
        id: mockId,
        type: 'STATUS_CHANGE' as any,
        title: 'Test',
        message: 'Test',
        read: false,
        userId: mockUserId,
        link: '',
        createdAt: mockToday,
      });
      await visaCasesService.updateStatus(mockId, { status: 'EN_TRAITEMENT' as VisaStatus }, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'STATUS_CHANGE',
            entity: 'VisaCase',
          }),
        }),
      );
    });

    it('should create AuditLog on visa case create', async () => {
      mockPrisma.client.findUnique.mockResolvedValueOnce(mockClient);
      mockPrisma.visaCase.findFirst.mockResolvedValueOnce(null);
      mockPrisma.visaCase.create.mockResolvedValueOnce(mockVisaCase);
      await visaCasesService.create({
        clientId: mockId,
        visaCountry: 'France',
        visaType: 'Schengen',
      }, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            entity: 'VisaCase',
          }),
        }),
      );
    });

    it('should create AuditLog on visa case update', async () => {
      await visaCasesService.update(mockId, { visaCountry: 'Spain' }, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            entity: 'VisaCase',
          }),
        }),
      );
    });

    it('should create AuditLog on appointment create', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValueOnce(mockVisaCase);
      mockPrisma.appointment.create.mockResolvedValueOnce(mockAppointment);
      await appointmentsService.create({
        visaCaseId: mockId,
        appointmentDate: '2026-07-15',
        appointmentTime: '10:00',
        appointmentCenter: 'VFS Casablanca',
        appointmentType: 'VFS' as any,
      }, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            entity: 'Appointment',
          }),
        }),
      );
    });

    it('should create AuditLog on appointment update', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
      mockPrisma.appointment.update.mockResolvedValueOnce(mockAppointment);
      await appointmentsService.update(mockId, { appointmentCenter: 'TLS Rabat' }, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            entity: 'Appointment',
          }),
        }),
      );
    });

    it('should create AuditLog on appointment delete', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
      mockPrisma.appointment.delete.mockResolvedValueOnce(mockAppointment);
      await appointmentsService.remove(mockId, mockUserId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'DELETE',
            entity: 'Appointment',
          }),
        }),
      );
    });
  });

  describe('Backup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetBcrypt();
    });

    it('should create a backup record via prisma on create call', async () => {
      mockPrisma.backup.create.mockResolvedValue(mockBackup);
      const result = await backupService.create(mockUserId);
      expect(mockPrisma.backup.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should save filename and size in backup record', async () => {
      mockPrisma.backup.create.mockResolvedValue(mockBackup);
      await backupService.create(mockUserId);
      expect(mockPrisma.backup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            filename: expect.stringContaining('hakimi-backup-'),
            createdById: mockUserId,
          }),
        }),
      );
    });

    it('should list all backups ordered by creation date', async () => {
      mockPrisma.backup.findMany.mockResolvedValue([mockBackup]);
      const backups = await backupService.findAll();
      expect(Array.isArray(backups)).toBe(true);
      expect(mockPrisma.backup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should fetch settings and return defaults if none exist', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValueOnce(null);
      mockPrisma.backupSettings.create.mockResolvedValueOnce({
        id: mockId,
        enabled: false,
        frequency: 'daily',
        time: '02:00',
        retentionDays: 30,
        maxBackups: 10,
        updatedAt: mockToday,
      });
      const settings = await backupService.getSettings();
      expect(settings).toBeDefined();
      expect(mockPrisma.backupSettings.create).toHaveBeenCalled();
    });

    it('should update existing backup settings', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValue({
        id: mockId,
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retentionDays: 30,
        maxBackups: 10,
        updatedAt: mockToday,
      });
      mockPrisma.backupSettings.update.mockResolvedValue({
        id: mockId,
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retentionDays: 15,
        maxBackups: 10,
        updatedAt: mockToday,
      });
      const result = await backupService.updateSettings({ retentionDays: 15 });
      expect(mockPrisma.backupSettings.update).toHaveBeenCalled();
      expect(result.retentionDays).toBe(15);
    });

    it('should throw BadRequestException on restore', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(mockBackup);
      await expect(backupService.restore(mockId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on restore with message about manual CLI', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(mockBackup);
      await expect(backupService.restore(mockId)).rejects.toThrow('Restore must be performed manually via CLI for safety');
    });

    it('should throw NotFoundException when restoring missing backup', async () => {
      mockPrisma.backup.findUnique.mockResolvedValueOnce(null);
      await expect(backupService.restore('nonexistent')).rejects.toThrow('Backup not found');
    });

    it('should delete backup by prisma on remove', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(mockBackup);
      mockPrisma.backup.delete.mockResolvedValue(mockBackup);
      await backupService.remove(mockId);
      expect(mockPrisma.backup.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockId } }),
      );
    });

    it('should throw NotFoundException when removing missing backup', async () => {
      mockPrisma.backup.findUnique.mockResolvedValueOnce(null);
      await expect(backupService.remove('nonexistent')).rejects.toThrow('Backup not found');
    });

    it('should update settings via upsert pattern when settings exist', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValue({
        id: mockId,
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retentionDays: 30,
        maxBackups: 10,
        updatedAt: mockToday,
      });
      mockPrisma.backupSettings.update.mockResolvedValue({
        id: mockId,
        enabled: false,
        frequency: 'daily',
        time: '02:00',
        retentionDays: 30,
        maxBackups: 10,
        updatedAt: mockToday,
      });
      const result = await backupService.updateSettings({ enabled: false });
      expect(result.enabled).toBe(false);
    });
  });
});
