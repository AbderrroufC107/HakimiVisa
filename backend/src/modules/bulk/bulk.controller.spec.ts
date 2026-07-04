import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';

describe('BulkController', () => {
  let controller: BulkController;
  let mockService: ReturnType<typeof mockDeep<BulkService>>;

  beforeEach(async () => {
    mockService = mockDeep<BulkService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkController],
      providers: [{ provide: BulkService, useValue: mockService }],
    }).compile();
    controller = module.get(BulkController);
  });

  describe('statusChange', () => {
    it('should call service.statusChange with dto and userId', async () => {
      const dto = { ids: ['case-1'], status: 'VISA_OK' as const };
      const expected = { total: 1, successful: 1, failed: 0, items: [] };
      mockService.statusChange.mockResolvedValue(expected);

      const result = await controller.statusChange(dto, 'user-1');
      expect(result).toBe(expected);
      expect(mockService.statusChange).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('createAppointments', () => {
    it('should call service.createAppointments with dto and userId', async () => {
      const dto = {
        ids: ['case-1'],
        appointmentDate: '2025-07-15',
        appointmentTime: '10:00',
        appointmentCenter: 'Alger',
        appointmentType: 'TLS' as const,
      };
      const expected = { total: 1, successful: 1, failed: 0, items: [] };
      mockService.createAppointments.mockResolvedValue(expected);

      const result = await controller.createAppointments(dto, 'user-1');
      expect(result).toBe(expected);
      expect(mockService.createAppointments).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('exportPdf', () => {
    it('should call service.exportPdf with dto and response', async () => {
      const dto = { ids: ['case-1'] };
      const mockRes = {} as any;
      mockService.exportPdf.mockResolvedValue(undefined);

      await controller.exportPdf(dto, mockRes);
      expect(mockService.exportPdf).toHaveBeenCalledWith(dto, mockRes);
    });
  });

  describe('exportExcel', () => {
    it('should call service.exportExcel and send response', async () => {
      const dto = { ids: ['case-1'] };
      const buffer = Buffer.from('excel');
      const mockRes = { set: jest.fn(), send: jest.fn() } as any;
      mockService.exportExcel.mockResolvedValue(buffer);

      await controller.exportExcel(dto, mockRes);
      expect(mockService.exportExcel).toHaveBeenCalledWith(dto);
      expect(mockRes.set).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(buffer);
    });
  });

  describe('archive', () => {
    it('should call service.archive with dto and userId', async () => {
      const dto = { ids: ['case-1'] };
      const expected = { total: 1, successful: 1, failed: 0, items: [] };
      mockService.archive.mockResolvedValue(expected);

      const result = await controller.archive(dto, 'user-1');
      expect(result).toBe(expected);
      expect(mockService.archive).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('restore', () => {
    it('should call service.restore with dto and userId', async () => {
      const dto = { ids: ['case-1'] };
      const expected = { total: 1, successful: 1, failed: 0, items: [] };
      mockService.restore.mockResolvedValue(expected);

      const result = await controller.restore(dto, 'user-1');
      expect(result).toBe(expected);
      expect(mockService.restore).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('delete', () => {
    it('should call service.delete with dto and userId', async () => {
      const dto = { ids: ['case-1'] };
      const expected = { total: 1, successful: 1, failed: 0, items: [] };
      mockService.delete.mockResolvedValue(expected);

      const result = await controller.delete(dto, 'user-1');
      expect(result).toBe(expected);
      expect(mockService.delete).toHaveBeenCalledWith(dto, 'user-1');
    });
  });
});
