import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { VisaDetailsController } from './visa-details.controller';
import { VisaDetailsService } from './visa-details.service';

describe('VisaDetailsController', () => {
  let controller: VisaDetailsController;
  let mockService: ReturnType<typeof mockDeep<VisaDetailsService>>;

  const mockVisaDetails = {
    id: 'vd-1',
    visaCaseId: 'case-1',
    validFrom: new Date('2025-07-01'),
    validUntil: new Date('2026-07-01'),
    durationDays: 90,
    entryType: 'MULTIPLE',
    visaNumber: 'V123456',
    notes: 'Test',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockService = mockDeep<VisaDetailsService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisaDetailsController],
      providers: [{ provide: VisaDetailsService, useValue: mockService }],
    }).compile();
    controller = module.get(VisaDetailsController);
  });

  describe('create', () => {
    it('should call service.create with params', async () => {
      const dto = {
        validFrom: '2025-07-01',
        validUntil: '2026-07-01',
        durationDays: 90,
        entryType: 'MULTIPLE' as const,
      };
      mockService.create.mockResolvedValue(mockVisaDetails);

      const result = await controller.create('case-1', dto, 'user-1');
      expect(result).toBe(mockVisaDetails);
      expect(mockService.create).toHaveBeenCalledWith('case-1', dto, 'user-1');
    });
  });

  describe('findByVisaCase', () => {
    it('should call service.findByVisaCase with visaCaseId', async () => {
      mockService.findByVisaCase.mockResolvedValue(mockVisaDetails);

      const result = await controller.findByVisaCase('case-1');
      expect(result).toBe(mockVisaDetails);
      expect(mockService.findByVisaCase).toHaveBeenCalledWith('case-1');
    });
  });

  describe('update', () => {
    it('should call service.update with params', async () => {
      const dto = { durationDays: 60 };
      mockService.update.mockResolvedValue(mockVisaDetails);

      const result = await controller.update('case-1', dto, 'user-1');
      expect(result).toBe(mockVisaDetails);
      expect(mockService.update).toHaveBeenCalledWith('case-1', dto, 'user-1');
    });
  });

  describe('remove', () => {
    it('should call service.remove with params', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('case-1', 'user-1');
      expect(result).toBeUndefined();
      expect(mockService.remove).toHaveBeenCalledWith('case-1', 'user-1');
    });
  });
});
