import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

describe('TrackingController', () => {
  let controller: TrackingController;
  let mockTrackingService: ReturnType<typeof mockDeep<TrackingService>>;

  beforeEach(async () => {
    mockTrackingService = mockDeep<TrackingService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrackingController],
      providers: [{ provide: TrackingService, useValue: mockTrackingService }],
    }).compile();
    controller = module.get(TrackingController);
  });

  describe('findByPhone', () => {
    it('should call service.findByPhone with query', async () => {
      const query = { phone: '+213600000000', case: 'VC-001' };
      const expected = { clientName: 'John Doe', cases: [], total: 0 };
      mockTrackingService.findByPhone.mockResolvedValue(expected);

      const result = await controller.findByPhone(query);
      expect(result).toBe(expected);
      expect(mockTrackingService.findByPhone).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call service.findOneForPublic with id', async () => {
      const expected = { id: 'case-1', caseNumber: 'VC-001' };
      mockTrackingService.findOneForPublic.mockResolvedValue(expected as any);

      const result = await controller.findOne('case-1');
      expect(result).toBe(expected);
      expect(mockTrackingService.findOneForPublic).toHaveBeenCalledWith('case-1');
    });
  });
});
