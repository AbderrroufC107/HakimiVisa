import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { NotFoundException } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TrackingService', () => {
  let service: TrackingService;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaService>>;

  const mockClient = { id: 'client-1', fullName: 'John Doe' };
  const mockCases = [
    {
      id: 'case-1',
      caseNumber: 'VC-001',
      visaCountry: 'France',
      visaType: 'TOURIST',
      currentStatus: 'EN_ATTENTE',
      openingDate: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
    },
  ];
  const mockVisaCaseFull = {
    id: 'case-1',
    caseNumber: 'VC-001',
    visaCountry: 'France',
    visaType: 'TOURIST',
    currentStatus: 'EN_ATTENTE',
    openingDate: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    client: { id: 'client-1', fullName: 'John Doe', phoneNumber: '+213600000000' },
    appointments: [
      {
        id: 'apt-1',
        appointmentDate: new Date('2025-07-01'),
        appointmentTime: '10:00',
        appointmentCenter: 'Alger Centre',
        appointmentType: 'VISA',
      },
    ],
    visaDetails: {
      validFrom: new Date('2025-07-01'),
      validUntil: new Date('2026-07-01'),
      durationDays: 90,
      entryType: 'MULTIPLE',
      visaNumber: 'V123456',
    },
    statusHistories: [
      { oldStatus: 'EN_ATTENTE', newStatus: 'EN_TRAITEMENT', changedAt: new Date('2025-06-15') },
    ],
  };

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TrackingService);
  });

  describe('findByPhone', () => {
    it('should return client with cases when found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(mockClient);
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases);

      const result = await service.findByPhone({ phone: '+213600000000' });
      expect(result.clientName).toBe('John Doe');
      expect(result.cases).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: { phoneNumber: { contains: '+213600000000' } },
        select: { id: true, fullName: true },
      });
    });

    it('should filter by case number when case filter is provided', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(mockClient);
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases);

      await service.findByPhone({ phone: '+213600000000', reference: 'VC-001' });
      expect(mockPrisma.visaCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: 'client-1', caseNumber: { contains: 'VC-001' } },
        }),
      );
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);
      await expect(service.findByPhone({ phone: '0000000000' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneForPublic', () => {
    it('should return visa case with relations when found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCaseFull);

      const result = await service.findOneForPublic('case-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('case-1');
      expect(result.client).toBeDefined();
      expect(result.appointments).toHaveLength(1);
      expect(result.visaDetails).toBeDefined();
      expect(result.statusHistories).toHaveLength(1);
    });

    it('should throw NotFoundException when visa case not found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(null);
      await expect(service.findOneForPublic('invalid-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
