import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppGateway } from '../gateway/app.gateway';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentDto,
} from './dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let mockAuditLog: DeepMockProxy<AuditLogService>;
  let mockNotifications: DeepMockProxy<NotificationsService>;
  let mockGateway: DeepMockProxy<AppGateway>;

  const mockUserId = 'user-1';
  const mockVisaCase = {
    id: 'vc-1',
    caseNumber: 'VISA-2025-0001',
    clientId: 'client-1',
    visaCountry: 'US',
    visaType: 'B1',
    currentStatus: 'EN_ATTENTE',
  };

  const mockAppointment = {
    id: 'apt-1',
    visaCaseId: 'vc-1',
    appointmentDate: new Date('2025-06-15'),
    appointmentTime: '10:00',
    appointmentCenter: 'Embassy Paris',
    appointmentType: 'INTERVIEW',
    notes: 'Bring documents',
    userId: mockUserId,
    createdAt: new Date('2025-05-01'),
    updatedAt: new Date('2025-05-01'),
  };

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaClient>();
    mockAuditLog = mockDeep<AuditLogService>();
    mockNotifications = mockDeep<NotificationsService>();
    mockGateway = mockDeep<AppGateway>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AppGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateAppointmentDto = {
      visaCaseId: 'vc-1',
      appointmentDate: '2025-06-15',
      appointmentTime: '10:00',
      appointmentCenter: 'Embassy Paris',
      appointmentType: 'INTERVIEW',
      notes: 'Bring documents',
    };

    it('should create an appointment, log audit, and broadcast', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase as any);
      const createdAppointment = {
        ...mockAppointment,
        visaCase: {
          caseNumber: 'VISA-2025-0001',
          client: { fullName: 'John Doe' },
        },
      };
      mockPrisma.appointment.create.mockResolvedValue(createdAppointment as any);
      mockAuditLog.log.mockResolvedValue({} as any);
      mockGateway.broadcast.mockReturnValue(undefined);

      const result = await service.create(dto, mockUserId);

      expect(mockPrisma.visaCase.findUnique).toHaveBeenCalledWith({
        where: { id: 'vc-1' },
      });
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: {
          visaCaseId: 'vc-1',
          appointmentDate: new Date('2025-06-15'),
          appointmentTime: '10:00',
          appointmentCenter: 'Embassy Paris',
          appointmentType: 'INTERVIEW',
          notes: 'Bring documents',
          userId: mockUserId,
        },
        include: {
          visaCase: {
            select: { caseNumber: true, client: { select: { fullName: true } } },
          },
        },
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'CREATE',
        entity: 'Appointment',
        entityId: 'apt-1',
        userId: mockUserId,
        metadata: {
          visaCaseId: 'vc-1',
          appointmentType: 'INTERVIEW',
          appointmentDate: '2025-06-15',
        },
      });
      expect(mockGateway.broadcast).toHaveBeenCalledWith('appointment:created', createdAppointment);
      expect(result).toEqual(createdAppointment);
    });

    it('should create appointment without optional notes', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase as any);
      const minimalDto: CreateAppointmentDto = {
        visaCaseId: 'vc-1',
        appointmentDate: '2025-06-20',
        appointmentTime: '14:30',
        appointmentCenter: 'Consulate NYC',
        appointmentType: 'BIOMETRICS',
      };
      const minimalAppointment = {
        ...mockAppointment,
        id: 'apt-2',
        appointmentDate: new Date('2025-06-20'),
        appointmentTime: '14:30',
        appointmentCenter: 'Consulate NYC',
        appointmentType: 'BIOMETRICS',
        notes: null,
        visaCase: {
          caseNumber: 'VISA-2025-0001',
          client: { fullName: 'John Doe' },
        },
      };
      mockPrisma.appointment.create.mockResolvedValue(minimalAppointment as any);
      mockAuditLog.log.mockResolvedValue({} as any);
      mockGateway.broadcast.mockReturnValue(undefined);

      const result = await service.create(minimalDto, mockUserId);

      expect(mockPrisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: undefined,
          }),
        }),
      );
      expect(result).toEqual(minimalAppointment);
    });

    it('should throw NotFoundException when visa case not found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto, mockUserId)).rejects.toThrow('Visa case not found');
      expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all appointments with default filters', async () => {
      const query: QueryAppointmentDto = {};
      mockPrisma.appointment.findMany.mockResolvedValue([mockAppointment] as any);

      const result = await service.findAll(query);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { appointmentDate: 'asc' },
        include: {
          visaCase: {
            select: {
              id: true, caseNumber: true, visaCountry: true, visaType: true, currentStatus: true,
              client: { select: { id: true, fullName: true, phoneNumber: true } },
            },
          },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      expect(result).toEqual([mockAppointment]);
    });

    it('should filter by visaCaseId', async () => {
      const query: QueryAppointmentDto = { visaCaseId: 'vc-1' };
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);

      await service.findAll(query);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { visaCaseId: 'vc-1' },
        }),
      );
    });

    it('should filter by date range', async () => {
      const query: QueryAppointmentDto = { dateFrom: '2025-06-01', dateTo: '2025-06-30' };
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);

      await service.findAll(query);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            appointmentDate: {
              gte: new Date('2025-06-01'),
              lte: new Date('2025-06-30'),
            },
          },
        }),
      );
    });

    it('should filter by appointmentType', async () => {
      const query: QueryAppointmentDto = { appointmentType: 'INTERVIEW' as any };
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);

      await service.findAll(query);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { appointmentType: 'INTERVIEW' },
        }),
      );
    });

    it('should filter by dateFrom only', async () => {
      const query: QueryAppointmentDto = { dateFrom: '2025-06-01' };
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);

      await service.findAll(query);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            appointmentDate: {
              gte: new Date('2025-06-01'),
            },
          },
        }),
      );
    });

    it('should filter by dateTo only', async () => {
      const query: QueryAppointmentDto = { dateTo: '2025-06-30' };
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);

      await service.findAll(query);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            appointmentDate: {
              lte: new Date('2025-06-30'),
            },
          },
        }),
      );
    });

    it('should search across appointmentCenter, caseNumber, and client fullName', async () => {
      const query: QueryAppointmentDto = { search: 'Paris' };
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);

      await service.findAll(query);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { appointmentCenter: { contains: 'Paris' } },
              { visaCase: { caseNumber: { contains: 'Paris' } } },
              { visaCase: { client: { fullName: { contains: 'Paris' } } } },
            ],
          },
        }),
      );
    });

    it('should combine all filters', async () => {
      const query: QueryAppointmentDto = {
        visaCaseId: 'vc-1',
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
        appointmentType: 'BIOMETRICS' as any,
        search: 'Embassy',
      };
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);

      await service.findAll(query);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            visaCaseId: 'vc-1',
            appointmentType: 'BIOMETRICS',
            appointmentDate: { gte: new Date('2025-06-01'), lte: new Date('2025-06-30') },
            OR: [
              { appointmentCenter: { contains: 'Embassy' } },
              { visaCase: { caseNumber: { contains: 'Embassy' } } },
              { visaCase: { client: { fullName: { contains: 'Embassy' } } } },
            ],
          },
        }),
      );
    });

    it('should return empty array when no appointments match', async () => {
      const query: QueryAppointmentDto = { search: 'NonExistent' };
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);

      const result = await service.findAll(query);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an appointment with relations', async () => {
      const appointmentWithRelations = {
        ...mockAppointment,
        visaCase: {
          id: 'vc-1',
          caseNumber: 'VISA-2025-0001',
          visaCountry: 'US',
          visaType: 'B1',
          currentStatus: 'EN_ATTENTE',
          client: { id: 'client-1', fullName: 'John Doe', phoneNumber: '+123', email: 'john@test.com', passportNumber: 'AB123', nationality: 'US' },
        },
        user: { id: 'user-1', firstName: 'Admin', lastName: 'User' },
      };
      mockPrisma.appointment.findUnique.mockResolvedValue(appointmentWithRelations as any);

      const result = await service.findOne('apt-1');

      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        include: {
          visaCase: {
            select: {
              id: true, caseNumber: true, visaCountry: true, visaType: true, currentStatus: true,
              client: { select: { id: true, fullName: true, phoneNumber: true, email: true, passportNumber: true, nationality: true } },
            },
          },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      expect(result).toEqual(appointmentWithRelations);
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow('Appointment not found');
    });
  });

  describe('update', () => {
    const dto: UpdateAppointmentDto = {
      appointmentDate: '2025-07-01',
      appointmentTime: '11:00',
      appointmentCenter: 'Updated Center',
    };

    it('should update an appointment, log audit, and broadcast', async () => {
      const existing = { ...mockAppointment, visaCaseId: 'vc-1' };
      mockPrisma.appointment.findUnique.mockResolvedValue(existing as any);
      const updatedAppointment = {
        ...mockAppointment,
        appointmentDate: new Date('2025-07-01'),
        appointmentTime: '11:00',
        appointmentCenter: 'Updated Center',
        visaCase: { caseNumber: 'VISA-2025-0001' },
      };
      mockPrisma.appointment.update.mockResolvedValue(updatedAppointment as any);
      mockAuditLog.log.mockResolvedValue({} as any);
      mockGateway.broadcast.mockReturnValue(undefined);

      const result = await service.update('apt-1', dto, mockUserId);

      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({ where: { id: 'apt-1' } });
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: {
          appointmentDate: new Date('2025-07-01'),
          appointmentTime: '11:00',
          appointmentCenter: 'Updated Center',
        },
        include: { visaCase: { select: { caseNumber: true } } },
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'UPDATE',
        entity: 'Appointment',
        entityId: 'apt-1',
        userId: mockUserId,
        metadata: { visaCaseId: 'vc-1' },
      });
      expect(mockGateway.broadcast).toHaveBeenCalledWith('appointment:updated', updatedAppointment);
      expect(result).toEqual(updatedAppointment);
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', dto, mockUserId)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
    });

    it('should handle partial update with only notes', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({ ...mockAppointment, visaCaseId: 'vc-1' } as any);
      const notesOnlyDto: UpdateAppointmentDto = { notes: 'Updated notes only' };
      const updated = { ...mockAppointment, notes: 'Updated notes only', visaCase: { caseNumber: 'VISA-2025-0001' } };
      mockPrisma.appointment.update.mockResolvedValue(updated as any);
      mockAuditLog.log.mockResolvedValue({} as any);
      mockGateway.broadcast.mockReturnValue(undefined);

      await service.update('apt-1', notesOnlyDto, mockUserId);

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { notes: 'Updated notes only' },
        include: { visaCase: { select: { caseNumber: true } } },
      });
    });
  });

  describe('remove', () => {
    it('should delete an appointment in a transaction and broadcast', async () => {
      const existing = { id: 'apt-1', visaCaseId: 'vc-1' };
      mockPrisma.appointment.findUnique.mockResolvedValue(existing as any);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);
      mockGateway.broadcast.mockReturnValue(undefined);

      await service.remove('apt-1', mockUserId);

      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({ where: { id: 'apt-1' } });
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        mockPrisma.appointment.delete({ where: { id: 'apt-1' } }),
        mockPrisma.auditLog.create({
          data: {
            action: 'DELETE',
            entity: 'Appointment',
            entityId: 'apt-1',
            userId: mockUserId,
            metadata: { visaCaseId: 'vc-1' },
          },
        }),
      ]);
      expect(mockGateway.broadcast).toHaveBeenCalledWith('appointment:deleted', { id: 'apt-1', visaCaseId: 'vc-1' });
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockGateway.broadcast).not.toHaveBeenCalled();
    });
  });
});
