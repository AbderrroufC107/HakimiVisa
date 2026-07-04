import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { NotFoundException } from '@nestjs/common';
import { VisaCasesController } from './visa-cases.controller';
import { VisaCasesService } from './visa-cases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('VisaCasesController', () => {
  let controller: VisaCasesController;
  let mockVisaCasesService: ReturnType<typeof mockDeep<VisaCasesService>>;

  const mockUserId = 'user-1';
  const mockVisaCase = {
    id: 'vc-1',
    caseNumber: 'VISA-2026-0001',
    clientId: 'client-1',
    visaCountry: 'US',
    visaType: 'B1',
    currentStatus: 'EN_ATTENTE',
    notes: null,
    createdBy: mockUserId,
    openingDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockVisaCasesService = mockDeep<VisaCasesService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisaCasesController],
      providers: [
        { provide: VisaCasesService, useValue: mockVisaCasesService },
      ],
    }).compile();
    controller = module.get(VisaCasesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Guard protection', () => {
    it('should have @UseGuards(JwtAuthGuard) at class level', () => {
      const guards = Reflect.getMetadata('__guards__', VisaCasesController);
      expect(guards).toBeDefined();
      expect(guards.length).toBe(1);
      expect(guards[0]).toBe(JwtAuthGuard);
    });
  });

  describe('POST /visa-cases', () => {
    it('should create a visa case', async () => {
      const dto = {
        clientId: 'client-1',
        visaCountry: 'US',
        visaType: 'B1',
        notes: 'Test note',
      };
      mockVisaCasesService.create.mockResolvedValue(mockVisaCase);

      const result = await controller.create(dto, mockUserId);

      expect(result).toBe(mockVisaCase);
      expect(mockVisaCasesService.create).toHaveBeenCalledWith(dto, mockUserId);
    });

    it('should propagate NotFoundException when client missing', async () => {
      mockVisaCasesService.create.mockRejectedValue(
        new NotFoundException('Client not found'),
      );

      await expect(
        controller.create(
          { clientId: 'bad-id', visaCountry: 'US', visaType: 'B1' },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /visa-cases', () => {
    it('should return paginated visa cases', async () => {
      const query = { search: 'VISA', page: 1, limit: 20 };
      const expected = {
        data: [mockVisaCase],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockVisaCasesService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(result).toBe(expected);
      expect(mockVisaCasesService.findAll).toHaveBeenCalledWith(query);
    });

    it('should pass empty query when none provided', async () => {
      const query = {};
      mockVisaCasesService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await controller.findAll(query);

      expect(mockVisaCasesService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /visa-cases/:id', () => {
    it('should return a visa case', async () => {
      mockVisaCasesService.findOne.mockResolvedValue(mockVisaCase);

      const result = await controller.findOne('vc-1');

      expect(result).toBe(mockVisaCase);
      expect(mockVisaCasesService.findOne).toHaveBeenCalledWith('vc-1');
    });

    it('should propagate NotFoundException', async () => {
      mockVisaCasesService.findOne.mockRejectedValue(
        new NotFoundException('Visa case not found'),
      );

      await expect(controller.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /visa-cases/:id', () => {
    it('should update a visa case', async () => {
      const dto = { visaCountry: 'Canada' };
      const updated = { ...mockVisaCase, visaCountry: 'Canada' };
      mockVisaCasesService.update.mockResolvedValue(updated);

      const result = await controller.update('vc-1', dto, mockUserId);

      expect(result).toBe(updated);
      expect(mockVisaCasesService.update).toHaveBeenCalledWith(
        'vc-1',
        dto,
        mockUserId,
      );
    });

    it('should propagate NotFoundException', async () => {
      mockVisaCasesService.update.mockRejectedValue(
        new NotFoundException('Visa case not found'),
      );

      await expect(
        controller.update('bad-id', { visaCountry: 'X' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /visa-cases/:id/status', () => {
    it('should update status', async () => {
      const dto = { status: 'EN_TRAITEMENT' as any };
      const updated = { ...mockVisaCase, currentStatus: 'EN_TRAITEMENT' };
      mockVisaCasesService.updateStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus('vc-1', dto, mockUserId);

      expect(result).toBe(updated);
      expect(mockVisaCasesService.updateStatus).toHaveBeenCalledWith(
        'vc-1',
        dto,
        mockUserId,
      );
    });

    it('should propagate NotFoundException', async () => {
      mockVisaCasesService.updateStatus.mockRejectedValue(
        new NotFoundException('Visa case not found'),
      );

      await expect(
        controller.updateStatus(
          'bad-id',
          { status: 'EN_TRAITEMENT' as any },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /visa-cases/:id/history', () => {
    it('should return status history', async () => {
      const history = [
        {
          id: 'sh-1',
          oldStatus: 'EN_ATTENTE',
          newStatus: 'EN_TRAITEMENT',
          changedAt: new Date(),
          changedBy: mockUserId,
          changer: {
            id: mockUserId,
            firstName: 'Admin',
            lastName: 'User',
          },
        },
      ];
      mockVisaCasesService.getHistory.mockResolvedValue(history as any);

      const result = await controller.getHistory('vc-1');

      expect(result).toBe(history);
      expect(mockVisaCasesService.getHistory).toHaveBeenCalledWith('vc-1');
    });

    it('should propagate NotFoundException', async () => {
      mockVisaCasesService.getHistory.mockRejectedValue(
        new NotFoundException('Visa case not found'),
      );

      await expect(controller.getHistory('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /visa-cases/:id', () => {
    it('should delete a visa case', async () => {
      mockVisaCasesService.remove.mockResolvedValue(undefined);

      await controller.remove('vc-1', mockUserId);

      expect(mockVisaCasesService.remove).toHaveBeenCalledWith(
        'vc-1',
        mockUserId,
      );
    });

    it('should propagate NotFoundException', async () => {
      mockVisaCasesService.remove.mockRejectedValue(
        new NotFoundException('Visa case not found'),
      );

      await expect(
        controller.remove('bad-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
