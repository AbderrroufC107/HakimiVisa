import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VisaDetailsService } from './visa-details.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';

describe('VisaDetailsService', () => {
  let service: VisaDetailsService;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaService>>;
  let mockAuditLog: ReturnType<typeof mockDeep<AuditLogService>>;

  const mockVisaCase = {
    id: 'case-1',
    caseNumber: 'VC-001',
    currentStatus: 'VISA_OK',
    clientId: 'client-1',
  };

  const mockVisaDetails = {
    id: 'vd-1',
    visaCaseId: 'case-1',
    validFrom: new Date('2025-07-01'),
    validUntil: new Date('2026-07-01'),
    durationDays: 90,
    entryType: 'MULTIPLE',
    visaNumber: 'V123456',
    notes: 'Test notes',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaService>();
    mockAuditLog = mockDeep<AuditLogService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisaDetailsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();
    service = module.get(VisaDetailsService);
  });

  describe('create', () => {
    const dto = {
      validFrom: '2025-07-01',
      validUntil: '2026-07-01',
      durationDays: 90,
      entryType: 'MULTIPLE' as const,
      visaNumber: 'V123456',
      notes: 'Test notes',
    };

    it('should create visa details and log audit', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      mockPrisma.visaDetails.findUnique.mockResolvedValue(null);
      mockPrisma.visaDetails.create.mockResolvedValue(mockVisaDetails);

      const result = await service.create('case-1', dto, 'user-1');
      expect(result).toBe(mockVisaDetails);
      expect(mockPrisma.visaDetails.create).toHaveBeenCalledWith({
        data: {
          visaCaseId: 'case-1',
          validFrom: new Date('2025-07-01'),
          validUntil: new Date('2026-07-01'),
          durationDays: 90,
          entryType: 'MULTIPLE',
          visaNumber: 'V123456',
          notes: 'Test notes',
        },
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'CREATE',
        entity: 'VisaDetails',
        entityId: 'vd-1',
        userId: 'user-1',
        metadata: { visaCaseId: 'case-1', entryType: 'MULTIPLE' },
      });
    });

    it('should throw NotFoundException when visa case not found', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(null);
      await expect(service.create('invalid', dto, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when status is not VISA_OK', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue({ ...mockVisaCase, currentStatus: 'EN_ATTENTE' });
      await expect(service.create('case-1', dto, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when visa details already exist', async () => {
      mockPrisma.visaCase.findUnique.mockResolvedValue(mockVisaCase);
      mockPrisma.visaDetails.findUnique.mockResolvedValue(mockVisaDetails);
      await expect(service.create('case-1', dto, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findByVisaCase', () => {
    it('should return visa details when found', async () => {
      mockPrisma.visaDetails.findUnique.mockResolvedValue(mockVisaDetails);
      const result = await service.findByVisaCase('case-1');
      expect(result).toBe(mockVisaDetails);
    });

    it('should return null when not found', async () => {
      mockPrisma.visaDetails.findUnique.mockResolvedValue(null);
      const result = await service.findByVisaCase('invalid');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const dto = { durationDays: 60, notes: 'Updated notes' };

    it('should update visa details and log audit', async () => {
      mockPrisma.visaDetails.findUnique.mockResolvedValue(mockVisaDetails);
      const updated = { ...mockVisaDetails, durationDays: 60, notes: 'Updated notes' };
      mockPrisma.visaDetails.update.mockResolvedValue(updated);

      const result = await service.update('case-1', dto, 'user-1');
      expect(result).toBe(updated);
      expect(mockPrisma.visaDetails.update).toHaveBeenCalledWith({
        where: { visaCaseId: 'case-1' },
        data: { durationDays: 60, notes: 'Updated notes' },
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'UPDATE',
        entity: 'VisaDetails',
        entityId: 'vd-1',
        userId: 'user-1',
        metadata: { visaCaseId: 'case-1' },
      });
    });

    it('should convert date strings to Date objects', async () => {
      mockPrisma.visaDetails.findUnique.mockResolvedValue(mockVisaDetails);
      mockPrisma.visaDetails.update.mockResolvedValue(mockVisaDetails);

      await service.update('case-1', { validFrom: '2025-08-01', validUntil: '2026-08-01' } as any, 'user-1');
      expect(mockPrisma.visaDetails.update).toHaveBeenCalledWith({
        where: { visaCaseId: 'case-1' },
        data: { validFrom: new Date('2025-08-01'), validUntil: new Date('2026-08-01') },
      });
    });

    it('should throw NotFoundException when details not found', async () => {
      mockPrisma.visaDetails.findUnique.mockResolvedValue(null);
      await expect(service.update('invalid', dto, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete visa details and log audit', async () => {
      mockPrisma.visaDetails.findUnique.mockResolvedValue(mockVisaDetails);
      mockPrisma.visaDetails.delete.mockResolvedValue(mockVisaDetails);

      await service.remove('case-1', 'user-1');
      expect(mockPrisma.visaDetails.delete).toHaveBeenCalledWith({
        where: { visaCaseId: 'case-1' },
      });
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        action: 'DELETE',
        entity: 'VisaDetails',
        entityId: 'vd-1',
        userId: 'user-1',
        metadata: { visaCaseId: 'case-1' },
      });
    });

    it('should throw NotFoundException when details not found', async () => {
      mockPrisma.visaDetails.findUnique.mockResolvedValue(null);
      await expect(service.remove('invalid', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
