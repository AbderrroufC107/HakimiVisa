import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppGateway } from '../gateway/app.gateway';
import { VisaCasesService } from './visa-cases.service';
import {
  CreateVisaCaseDto,
  UpdateVisaCaseDto,
  UpdateStatusDto,
  QueryVisaCaseDto,
} from './dto';

describe('VisaCasesService', () => {
  let service: VisaCasesService;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let mockAuditLog: DeepMockProxy<AuditLogService>;
  let mockNotifications: DeepMockProxy<NotificationsService>;
  let mockGateway: DeepMockProxy<AppGateway>;

  const mockUserId = 'user-1';
  const mockClient = {
    id: 'client-1',
    fullName: 'John Doe',
    phoneNumber: '+123456789',
  };

  const mockVisaCase = {
    id: 'vc-1',
    caseNumber: 'VISA-2026-0001',
    clientId: 'client-1',
    visaCountry: 'US',
    visaType: 'B1',
    currentStatus: 'EN_ATTENTE',
    notes: 'Some notes',
    createdBy: mockUserId,
    openingDate: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockUpdatedVisaCase = { ...mockVisaCase, currentStatus: 'EN_TRAITEMENT' };

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaClient>();
    mockAuditLog = mockDeep<AuditLogService>();
    mockNotifications = mockDeep<NotificationsService>();
    mockGateway = mockDeep<AppGateway>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisaCasesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AppGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<VisaCasesService>(VisaCasesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateVisaCaseDto = {
      clientId: 'client-1',
      visaCountry: 'US',
      visaType: 'B1',
      notes: 'Some notes',
    };

    it('should create a visa case with generated case number', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient as any);
      mockPrisma.visaCase.findFirst.mockResolvedValue(null);
      mockPrisma.visaCase.create.mockResolvedValue(mockVisaCase);
      mockAuditLog.log.mockResolvedValue({} as any);

      const result = await service.create(dto, mockUserId);

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'client-1' },
      });
      expect(mockPrisma.visaCase.create).toHaveBeenCalledWith({
        data: {
    caseNumber: 'VISA-2026-0001',
          clientId: 'client-1',
          visaCountry: 'US',
          visaType: 'B1',
          currentStatus: 'EN_ATTENTE',
          notes: 'Some notes',
          createdBy: mockUserId,
        },
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'CREATE',
        entity: 'VisaCase',
        entityId: 'vc-1',
        userId: mockUserId,
        metadata: { caseNumber: 'VISA-2026-0001', clientId: 'client-1' },
      });
      expect(result).toEqual(mockVisaCase);
    });

    it('should use provided status instead of default', async () => {
      const dtoWithStatus: CreateVisaCaseDto = {
        clientId: 'client-1',
        visaCountry: 'UK',
        visaType: 'T4',
        currentStatus: 'EN_TRAITEMENT' as any,
      };
      mockPrisma.client.findUnique.mockResolvedValue(mockClient as any);
      mockPrisma.visaCase.findFirst.mockResolvedValue(null);
      mockPrisma.visaCase.create.mockResolvedValue({ ...mockVisaCase, currentStatus: 'EN_TRAITEMENT' });
      mockAuditLog.log.mockResolvedValue({} as any);

      await service.create(dtoWithStatus, mockUserId);

      expect(mockPrisma.visaCase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStatus: 'EN_TRAITEMENT' }),
        }),
      );
    });

    it('should generate sequential case numbers', async () => {
      const lastCase = { caseNumber: 'VISA-2026-0005' };
      mockPrisma.client.findUnique.mockResolvedValue(mockClient as any);
      mockPrisma.visaCase.findFirst.mockResolvedValue(lastCase as any);
      mockPrisma.visaCase.create.mockResolvedValue({ ...mockVisaCase, caseNumber: 'VISA-2026-0006' });
      mockAuditLog.log.mockResolvedValue({} as any);

      await service.create(dto, mockUserId);

      expect(mockPrisma.visaCase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ caseNumber: 'VISA-2026-0006' }),
        }),
      );
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto, mockUserId)).rejects.toThrow('Client not found');
      expect(mockPrisma.visaCase.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated visa cases', async () => {
      const query: QueryVisaCaseDto = { page: 1, limit: 20 };
      mockPrisma.visaCase.findMany.mockResolvedValue([mockVisaCase] as any);
      mockPrisma.visaCase.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(mockPrisma.visaCase.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, fullName: true, phoneNumber: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should filter by status', async () => {
      const query: QueryVisaCaseDto = { status: 'VISA_OK' as any };
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrisma.visaCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { currentStatus: 'VISA_OK' },
        }),
      );
    });

    it('should filter by clientId', async () => {
      const query: QueryVisaCaseDto = { clientId: 'client-1' };
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrisma.visaCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: 'client-1' },
        }),
      );
    });

    it('should search by caseNumber or client fullName', async () => {
      const query: QueryVisaCaseDto = { search: 'VISA' };
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrisma.visaCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { caseNumber: { contains: 'VISA' } },
              { client: { fullName: { contains: 'VISA' } } },
            ],
          },
        }),
      );
    });

    it('should combine all filters', async () => {
      const query: QueryVisaCaseDto = {
        search: 'John', status: 'EN_ATTENTE' as any, clientId: 'client-1', page: 2, limit: 10,
      };
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrisma.visaCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            currentStatus: 'EN_ATTENTE',
            clientId: 'client-1',
            OR: [
              { caseNumber: { contains: 'John' } },
              { client: { fullName: { contains: 'John' } } },
            ],
          },
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should handle empty result set', async () => {
      const query: QueryVisaCaseDto = { page: 1, limit: 20 };
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.count.mockResolvedValue(0);

      const result = await service.findAll(query);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a visa case with relations', async () => {
      const visaCaseWithRelations = {
        ...mockVisaCase,
        client: mockClient,
        creator: { id: 'user-1', firstName: 'Admin', lastName: 'User' },
        statusHistories: [],
      };
      mockPrisma.visaCase.findUnique.mockResolvedValue(visaCaseWithRelations as any);

      const result = await service.findOne('vc-1');

      expect(mockPrisma.visaCase.findUnique).toHaveBeenCalledWith({
        where: { id: 'vc-1' },
        include: {
          client: true,
          creator: { select: { id: true, firstName: true, lastName: true } },
          statusHistories: {
            orderBy: { changedAt: 'desc' },
            include: { changer: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
      });
      expect(result).toEqual(visaCaseWithRelations);
    });

    it('should throw NotFoundException when visa case not found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow('Visa case not found');
    });
  });

  describe('update', () => {
    const dto: UpdateVisaCaseDto = { visaCountry: 'Canada', visaType: 'TRV' };

    it('should update a visa case and log audit', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      const updated = { ...mockVisaCase, visaCountry: 'Canada', visaType: 'TRV' };
      mockPrisma.visaCase.update.mockResolvedValue(updated);
      mockAuditLog.log.mockResolvedValue({} as any);

      const result = await service.update('vc-1', dto, mockUserId);

      expect(mockPrisma.visaCase.update).toHaveBeenCalledWith({
        where: { id: 'vc-1' },
        data: dto,
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'UPDATE',
        entity: 'VisaCase',
        entityId: 'vc-1',
        userId: mockUserId,
        metadata: { caseNumber: 'VISA-2026-0001' },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when visa case not found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', dto, mockUserId)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.visaCase.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when new clientId references non-existent client', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(
        service.update('vc-1', { clientId: 'non-existent-client' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.visaCase.update).not.toHaveBeenCalled();
    });

    it('should verify client exists when clientId is being changed', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-2', fullName: 'Jane', phoneNumber: '+222' } as any);
      mockPrisma.visaCase.update.mockResolvedValue({ ...mockVisaCase, clientId: 'client-2' });
      mockAuditLog.log.mockResolvedValue({} as any);

      await service.update('vc-1', { clientId: 'client-2' }, mockUserId);

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({ where: { id: 'client-2' } });
    });
  });

  describe('updateStatus', () => {
    const dto: UpdateStatusDto = { status: 'EN_TRAITEMENT' as any };

    it('should update status via transaction and send notifications', async () => {
      mockPrisma.visaCase.findUnique
        .mockResolvedValueOnce(mockVisaCase)         // first check
        .mockResolvedValueOnce({                      // after update: findUnique with client
          ...mockUpdatedVisaCase,
          client: { fullName: 'John Doe' },
        });
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([mockUpdatedVisaCase]);
      mockPrisma.user.findUnique.mockResolvedValue({ firstName: 'Admin', lastName: 'User' });
      mockAuditLog.log.mockResolvedValue({} as any);
      mockNotifications.create.mockResolvedValue({} as any);
      mockGateway.broadcast.mockReturnValue(undefined);

      const result = await service.updateStatus('vc-1', dto, mockUserId);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        mockPrisma.visaCase.update({ where: { id: 'vc-1' }, data: { currentStatus: 'EN_TRAITEMENT' } }),
        mockPrisma.statusHistory.create({
          data: { visaCaseId: 'vc-1', oldStatus: 'EN_ATTENTE', newStatus: 'EN_TRAITEMENT', changedBy: mockUserId },
        }),
      ]);
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'STATUS_CHANGE',
        entity: 'VisaCase',
        entityId: 'vc-1',
        userId: mockUserId,
        metadata: { caseNumber: 'VISA-2026-0001', from: 'EN_ATTENTE', to: 'EN_TRAITEMENT' },
      });
      expect(mockNotifications.create).toHaveBeenCalledWith({
        type: 'STATUS_CHANGE',
        title: 'Visa Case Status Updated',
        message: expect.stringContaining('EN_ATTENTE to EN_TRAITEMENT'),
        userId: mockUserId,
        link: '/visa-cases/vc-1',
      });
      expect(mockGateway.broadcast).toHaveBeenCalledWith('visaCase:statusChange', {
        id: 'vc-1',
        caseNumber: 'VISA-2026-0001',
        oldStatus: 'EN_ATTENTE',
        newStatus: 'EN_TRAITEMENT',
        changedBy: 'Admin User',
      });
      expect(result).toEqual(mockUpdatedVisaCase);
    });

    it('should return existing case when status is unchanged', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      const sameStatusDto: UpdateStatusDto = { status: 'EN_ATTENTE' as any };

      const result = await service.updateStatus('vc-1', sameStatusDto, mockUserId);

      expect(result).toEqual(mockVisaCase);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockNotifications.create).not.toHaveBeenCalled();
      expect(mockGateway.broadcast).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when visa case not found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('non-existent', dto, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should broadcast with "Unknown" when changer not found', async () => {
      mockPrisma.visaCase.findUnique
        .mockResolvedValueOnce(mockVisaCase)
        .mockResolvedValueOnce({ ...mockUpdatedVisaCase, client: { fullName: 'John Doe' } });
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([mockUpdatedVisaCase]);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockAuditLog.log.mockResolvedValue({} as any);
      mockNotifications.create.mockResolvedValue({} as any);
      mockGateway.broadcast.mockReturnValue(undefined);

      await service.updateStatus('vc-1', dto, mockUserId);

      expect(mockGateway.broadcast).toHaveBeenCalledWith('visaCase:statusChange', {
        id: 'vc-1',
        caseNumber: 'VISA-2026-0001',
        oldStatus: 'EN_ATTENTE',
        newStatus: 'EN_TRAITEMENT',
        changedBy: 'Unknown',
      });
    });
  });

  describe('getHistory', () => {
    it('should return status history for a visa case', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue({ id: 'vc-1' } as any);
      const history = [
        {
          id: 'sh-1',
          visaCaseId: 'vc-1',
          oldStatus: 'EN_ATTENTE',
          newStatus: 'EN_TRAITEMENT',
          changedAt: new Date(),
          changedBy: mockUserId,
          changer: { id: mockUserId, firstName: 'Admin', lastName: 'User' },
        },
      ];
      mockPrisma.statusHistory.findMany.mockResolvedValue(history as any);

      const result = await service.getHistory('vc-1');

      expect(mockPrisma.statusHistory.findMany).toHaveBeenCalledWith({
        where: { visaCaseId: 'vc-1' },
        orderBy: { changedAt: 'desc' },
        include: { changer: { select: { id: true, firstName: true, lastName: true } } },
      });
      expect(result).toEqual(history);
    });

    it('should throw NotFoundException when visa case not found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(null);

      await expect(service.getHistory('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when no history exists', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue({ id: 'vc-1' } as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([] as any);

      const result = await service.getHistory('vc-1');

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should delete a visa case in a transaction', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      await service.remove('vc-1', mockUserId);

      expect(mockPrisma.visaCase.findUnique).toHaveBeenCalledWith({ where: { id: 'vc-1' } });
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        mockPrisma.visaCase.delete({ where: { id: 'vc-1' } }),
        mockPrisma.auditLog.create({
          data: {
            action: 'DELETE',
            entity: 'VisaCase',
            entityId: 'vc-1',
            userId: mockUserId,
            metadata: { caseNumber: 'VISA-2026-0001' },
          },
        }),
      ]);
    });

    it('should throw NotFoundException when visa case not found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
