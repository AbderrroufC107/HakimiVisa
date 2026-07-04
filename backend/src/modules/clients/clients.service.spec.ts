import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto';

describe('ClientsService', () => {
  let service: ClientsService;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let mockAuditLog: DeepMockProxy<AuditLogService>;

  const mockClient = {
    id: 'client-1',
    fullName: 'John Doe',
    phoneNumber: '+123456789',
    whatsappNumber: '+123456789',
    email: 'john@example.com',
    passportNumber: 'AB123456',
    nationality: 'US',
    notes: 'Some notes',
    createdBy: 'user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockUserId = 'user-1';

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaClient>();
    mockAuditLog = mockDeep<AuditLogService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateClientDto = {
      fullName: 'John Doe',
      phoneNumber: '+123456789',
      whatsappNumber: '+123456789',
      email: 'john@example.com',
      passportNumber: 'AB123456',
      nationality: 'US',
      notes: 'Some notes',
    };

    it('should create a client and log audit', async () => {
      mockPrisma.client.create.mockResolvedValue(mockClient);
      mockAuditLog.log.mockResolvedValue({} as any);

      const result = await service.create(dto, mockUserId);

      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          fullName: dto.fullName,
          phoneNumber: dto.phoneNumber,
          whatsappNumber: dto.whatsappNumber,
          email: dto.email,
          passportNumber: dto.passportNumber,
          nationality: dto.nationality,
          notes: dto.notes,
          createdBy: mockUserId,
        },
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'CREATE',
        entity: 'Client',
        entityId: 'client-1',
        userId: mockUserId,
        metadata: { fullName: 'John Doe' },
      });
      expect(result).toEqual(mockClient);
    });

    it('should create a client with minimal fields', async () => {
      const minimalDto: CreateClientDto = {
        fullName: 'Minimal Client',
        phoneNumber: '+000000000',
      };
      const minimalClient = {
        ...mockClient,
        id: 'client-2',
        fullName: 'Minimal Client',
        phoneNumber: '+000000000',
        whatsappNumber: null,
        email: null,
        passportNumber: null,
        nationality: null,
        notes: null,
      };
      mockPrisma.client.create.mockResolvedValue(minimalClient as any);
      mockAuditLog.log.mockResolvedValue({} as any);

      const result = await service.create(minimalDto, mockUserId);

      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Minimal Client',
          phoneNumber: '+000000000',
          whatsappNumber: undefined,
          email: undefined,
          passportNumber: undefined,
          nationality: undefined,
          notes: undefined,
          createdBy: mockUserId,
        },
      });
      expect(result.fullName).toBe('Minimal Client');
    });
  });

  describe('findAll', () => {
    it('should return paginated clients without search', async () => {
      const query: QueryClientDto = { page: 1, limit: 20 };
      const mockData = [mockClient];
      const mockCount = 1;

      mockPrisma.client.findMany.mockResolvedValue(mockData as any);
      mockPrisma.client.count.mockResolvedValue(mockCount);

      const result = await service.findAll(query);

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { visaCases: true } } },
      });
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(result.data).toEqual(mockData);
    });

    it('should search clients by fullName, phoneNumber, passportNumber', async () => {
      const query: QueryClientDto = { search: 'John', page: 1, limit: 10 };
      mockPrisma.client.findMany.mockResolvedValue([mockClient] as any);
      mockPrisma.client.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fullName: { contains: 'John' } },
            { phoneNumber: { contains: 'John' } },
            { passportNumber: { contains: 'John' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { visaCases: true } } },
      });
    });

    it('should handle pagination correctly', async () => {
      const query: QueryClientDto = { page: 3, limit: 15 };
      mockPrisma.client.findMany.mockResolvedValue([] as any);
      mockPrisma.client.count.mockResolvedValue(50);

      const result = await service.findAll(query);

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 30, take: 15 }),
      );
      expect(result.meta).toEqual({ total: 50, page: 3, limit: 15, totalPages: 4 });
    });

    it('should return empty data when no clients match', async () => {
      const query: QueryClientDto = { search: 'NonExistent' };
      mockPrisma.client.findMany.mockResolvedValue([] as any);
      mockPrisma.client.count.mockResolvedValue(0);

      const result = await service.findAll(query);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a client with visaCases and _count', async () => {
      const clientWithRelations = {
        ...mockClient,
        visaCases: [],
        _count: { visaCases: 0 },
      };
      mockPrisma.client.findUnique.mockResolvedValue(clientWithRelations as any);

      const result = await service.findOne('client-1');

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        include: {
          visaCases: { orderBy: { createdAt: 'desc' } },
          _count: { select: { visaCases: true } },
        },
      });
      expect(result).toEqual(clientWithRelations);
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow('Client not found');
    });
  });

  describe('update', () => {
    const dto: UpdateClientDto = { fullName: 'Updated Name', phoneNumber: '+999999999' };

    it('should update a client and log audit', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      const updatedClient = { ...mockClient, fullName: 'Updated Name', phoneNumber: '+999999999' };
      mockPrisma.client.update.mockResolvedValue(updatedClient);
      mockAuditLog.log.mockResolvedValue({} as any);

      const result = await service.update('client-1', dto, mockUserId);

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({ where: { id: 'client-1' } });
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        data: dto,
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'UPDATE',
        entity: 'Client',
        entityId: 'client-1',
        userId: mockUserId,
        metadata: { fullName: 'Updated Name' },
      });
      expect(result).toEqual(updatedClient);
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', dto, mockUserId)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.client.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a client and create audit log in transaction', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      await service.remove('client-1', mockUserId);

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({ where: { id: 'client-1' } });
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        mockPrisma.client.delete({ where: { id: 'client-1' } }),
        mockPrisma.auditLog.create({
          data: {
            action: 'DELETE',
            entity: 'Client',
            entityId: 'client-1',
            userId: mockUserId,
            metadata: { fullName: 'John Doe' },
          },
        }),
      ]);
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return client profile with relations', async () => {
      const profileData = {
        ...mockClient,
        creator: { id: 'user-1', firstName: 'Admin', lastName: 'User' },
        visaCases: [],
        _count: { visaCases: 0, internalNotes: 0 },
      };
      mockPrisma.client.findUnique.mockResolvedValue(profileData as any);

      const result = await service.getProfile('client-1');

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        include: expect.objectContaining({
          creator: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { visaCases: true, internalNotes: true } },
        }),
      });
      expect(result).toEqual(profileData);
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTimeline', () => {
    const mockTimelineClient = {
      id: 'client-1',
      createdAt: new Date('2025-01-01'),
      createdBy: 'user-1',
      fullName: 'John Doe',
    };

    it('should return sorted timeline entries', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockTimelineClient as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([] as any);
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.auditLog.findMany.mockResolvedValue([] as any);

      const result = await service.getTimeline('client-1');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('CLIENT_CREATED');
      expect(result[0].label).toBe('Client Created');
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.getTimeline('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should include status history entries', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockTimelineClient as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([
        {
          id: 'sh-1',
          changedAt: new Date('2025-02-01'),
          changedBy: 'user-1',
          oldStatus: 'EN_ATTENTE',
          newStatus: 'EN_TRAITEMENT',
          changer: { id: 'user-1', firstName: 'Admin', lastName: 'User' },
          visaCase: { caseNumber: 'VISA-2025-0001' },
        },
      ] as any);
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.findMany.mockResolvedValue([{ id: 'vc-1' }] as any);
      mockPrisma.auditLog.findMany.mockResolvedValue([] as any);

      const result = await service.getTimeline('client-1');

      const statusEntry = result.find((e) => e.type === 'STATUS_CHANGE');
      expect(statusEntry).toBeDefined();
      expect(statusEntry!.description).toContain('EN ATTENTE');
    });

    it('should include appointment entries', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockTimelineClient as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([] as any);
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: 'apt-1',
          appointmentType: 'VISA_INTERVIEW',
          appointmentCenter: 'Embassy Paris',
          appointmentDate: new Date('2025-03-01'),
          createdAt: new Date('2025-02-15'),
          userId: 'user-1',
          user: { id: 'user-1', firstName: 'Admin', lastName: 'User' },
          visaCase: { caseNumber: 'VISA-2025-0001' },
        },
      ] as any);
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.auditLog.findMany.mockResolvedValue([] as any);

      const result = await service.getTimeline('client-1');

      const aptEntry = result.find((e) => e.type === 'APPOINTMENT_ADDED');
      expect(aptEntry).toBeDefined();
      expect(aptEntry!.description).toContain('Embassy Paris');
    });

    it('should include audit log entries', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockTimelineClient as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([] as any);
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'al-1',
          action: 'UPDATE',
          entity: 'Client',
          entityId: 'client-1',
          userId: 'user-1',
          createdAt: new Date('2025-01-15'),
          metadata: { test: true },
          user: { id: 'user-1', firstName: 'Admin', lastName: 'User' },
        },
      ] as any);

      const result = await service.getTimeline('client-1');

      const auditEntry = result.find((e) => e.id === 'audit-al-1');
      expect(auditEntry).toBeDefined();
      expect(auditEntry!.type).toBe('ENTITY_UPDATED');
    });

    it('should sort entries by timestamp descending', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockTimelineClient as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([] as any);
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'al-2',
          action: 'DELETE',
          entity: 'Client',
          entityId: 'client-1',
          userId: 'user-1',
          createdAt: new Date('2025-06-01'),
          metadata: null,
          user: null,
        },
      ] as any);

      const result = await service.getTimeline('client-1');

      expect(result[0].id).toBe('audit-al-2');
      expect(result[1].id).toBe('client-created-client-1');
    });
  });

  describe('getStats', () => {
    it('should return computed stats for a client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' } as any);
      mockPrisma.visaCase.count.mockResolvedValue(0);
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.groupBy.mockResolvedValue([] as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([] as any);

      const result = await service.getStats('client-1');

      expect(result).toHaveProperty('totalApplications');
      expect(result).toHaveProperty('approvalRate');
      expect(result).toHaveProperty('refusalRate');
      expect(result).toHaveProperty('avgProcessingTime');
      expect(result).toHaveProperty('upcomingAppointments');
      expect(result).toHaveProperty('pastAppointments');
      expect(result).toHaveProperty('countries');
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.getStats('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should calculate approval and refusal rates correctly', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' } as any);
      mockPrisma.visaCase.count
        .mockResolvedValueOnce(10)  // totalApplications
        .mockResolvedValueOnce(6)   // approved
        .mockResolvedValueOnce(2)   // refused
        .mockResolvedValueOnce(2);  // pending
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.findMany.mockResolvedValue([
        { id: 'vc-1', openingDate: new Date('2025-01-01'), createdAt: new Date('2025-01-01') },
        { id: 'vc-2', openingDate: new Date('2025-02-01'), createdAt: new Date('2025-02-01') },
      ] as any);
      mockPrisma.visaCase.groupBy.mockResolvedValue([] as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([
        { visaCaseId: 'vc-1', changedAt: new Date('2025-03-01') },
        { visaCaseId: 'vc-2', changedAt: new Date('2025-04-01') },
      ] as any);

      const result = await service.getStats('client-1');

      expect(result.totalApplications).toBe(10);
      expect(result.approved).toBe(6);
      expect(result.refused).toBe(2);
      expect(result.approvalRate).toBe(75);
      expect(result.refusalRate).toBe(25);
    });

    it('should return zero rates when no completed cases', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' } as any);
      mockPrisma.visaCase.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.appointment.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.groupBy.mockResolvedValue([] as any);
      mockPrisma.statusHistory.findMany.mockResolvedValue([] as any);

      const result = await service.getStats('client-1');

      expect(result.approvalRate).toBe(0);
      expect(result.refusalRate).toBe(0);
      expect(result.avgProcessingTime).toBe(0);
    });
  });

  describe('getDocuments', () => {
    it('should return documents for a client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' } as any);
      const mockDocs = [
        {
          id: 'doc-1',
          fileName: 'passport.pdf',
          uploadedAt: new Date('2025-01-01'),
          visaCase: { caseNumber: 'VISA-2025-0001', visaCountry: 'US', visaType: 'B1' },
        },
      ];
      mockPrisma.document.findMany.mockResolvedValue(mockDocs as any);

      const result = await service.getDocuments('client-1');

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { visaCase: { clientId: 'client-1' } },
        orderBy: { uploadedAt: 'desc' },
        include: {
          visaCase: { select: { caseNumber: true, visaCountry: true, visaType: true } },
        },
      });
      expect(result).toEqual(mockDocs);
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.getDocuments('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when no documents exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' } as any);
      mockPrisma.document.findMany.mockResolvedValue([] as any);

      const result = await service.getDocuments('client-1');

      expect(result).toEqual([]);
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard counts', async () => {
      mockPrisma.client.count.mockResolvedValue(100);
      mockPrisma.visaCase.count
        .mockResolvedValueOnce(200)  // totalCases
        .mockResolvedValueOnce(50)   // enAttente
        .mockResolvedValueOnce(40)   // enTraitement
        .mockResolvedValueOnce(30)   // rdvOk
        .mockResolvedValueOnce(60)   // visaOk
        .mockResolvedValueOnce(20);  // refuse

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        totalClients: 100,
        totalCases: 200,
        enAttente: 50,
        enTraitement: 40,
        rdvOk: 30,
        visaOk: 60,
        refuse: 20,
      });
    });

    it('should return zero counts when no data', async () => {
      mockPrisma.client.count.mockResolvedValue(0);
      mockPrisma.visaCase.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getDashboardStats();

      expect(result.totalClients).toBe(0);
      expect(result.totalCases).toBe(0);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.groupBy
        .mockResolvedValueOnce([] as any) // countries
        .mockResolvedValueOnce([] as any); // statusGroup

      const result = await service.getAnalytics();

      expect(result).toHaveProperty('applicationsPerMonth');
      expect(result).toHaveProperty('topCountries');
      expect(result).toHaveProperty('statusDistribution');
      expect(result).toHaveProperty('approvalRate');
    });

    it('should aggregate applications by month for last 6 months', async () => {
      const mockCases = [
        { createdAt: new Date(), visaCountry: 'US', currentStatus: 'VISA_OK' },
        { createdAt: new Date(), visaCountry: 'UK', currentStatus: 'VISA_REFUSEE' },
      ];
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases as any);
      mockPrisma.visaCase.groupBy
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce([] as any);

      const result = await service.getAnalytics();

      expect(result.applicationsPerMonth.length).toBe(6);
      expect(result.approvalRate).toBe(0);
    });

    it('should calculate status distribution with defaults for missing statuses', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.groupBy
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce([
          { currentStatus: 'VISA_OK', _count: { id: 10 } },
        ] as any);

      const result = await service.getAnalytics();

      expect(result.statusDistribution).toEqual([
        { status: 'EN_ATTENTE', count: 0 },
        { status: 'EN_TRAITEMENT', count: 0 },
        { status: 'RDV_OK', count: 0 },
        { status: 'VISA_OK', count: 10 },
        { status: 'VISA_REFUSEE', count: 0 },
      ]);
    });

    it('should calculate approval rate from status distribution', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([] as any);
      mockPrisma.visaCase.groupBy
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce([
          { currentStatus: 'VISA_OK', _count: { id: 30 } },
          { currentStatus: 'VISA_REFUSEE', _count: { id: 10 } },
        ] as any);

      const result = await service.getAnalytics();

      expect(result.approvalRate).toBe(75);
    });
  });
});
