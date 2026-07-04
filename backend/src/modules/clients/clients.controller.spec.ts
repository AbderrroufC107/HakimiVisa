import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { NotFoundException } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('ClientsController', () => {
  let controller: ClientsController;
  let mockClientsService: ReturnType<typeof mockDeep<ClientsService>>;

  const mockUserId = 'user-1';
  const mockClient = {
    id: 'client-1',
    fullName: 'John Doe',
    phoneNumber: '+123456789',
    email: 'john@example.com',
    passportNumber: 'AB123456',
    nationality: 'US',
    notes: null,
    createdBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockClientsService = mockDeep<ClientsService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockClientsService }],
    }).compile();
    controller = module.get(ClientsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Guard protection', () => {
    it('should have @UseGuards(JwtAuthGuard) at class level', () => {
      const guards = Reflect.getMetadata('__guards__', ClientsController);
      expect(guards).toBeDefined();
      expect(guards.length).toBe(1);
      expect(guards[0]).toBe(JwtAuthGuard);
    });
  });

  describe('GET /clients/dashboard', () => {
    it('should return dashboard stats', async () => {
      const stats = {
        totalClients: 100,
        totalCases: 200,
        enAttente: 50,
        enTraitement: 40,
        rdvOk: 30,
        visaOk: 60,
        refuse: 20,
      };
      mockClientsService.getDashboardStats.mockResolvedValue(stats);

      const result = await controller.getDashboardStats();

      expect(result).toBe(stats);
      expect(mockClientsService.getDashboardStats).toHaveBeenCalled();
    });
  });

  describe('GET /clients/analytics', () => {
    it('should return analytics', async () => {
      const analytics = {
        applicationsPerMonth: [],
        topCountries: [],
        statusDistribution: [],
        approvalRate: 75,
      };
      mockClientsService.getAnalytics.mockResolvedValue(analytics);

      const result = await controller.getAnalytics();

      expect(result).toBe(analytics);
      expect(mockClientsService.getAnalytics).toHaveBeenCalled();
    });
  });

  describe('POST /clients', () => {
    it('should create a client', async () => {
      const dto = {
        fullName: 'John Doe',
        phoneNumber: '+123456789',
        email: 'john@example.com',
      };
      mockClientsService.create.mockResolvedValue(mockClient);

      const result = await controller.create(dto, mockUserId);

      expect(result).toBe(mockClient);
      expect(mockClientsService.create).toHaveBeenCalledWith(dto, mockUserId);
    });
  });

  describe('GET /clients', () => {
    it('should return paginated clients', async () => {
      const query = { search: 'John', page: 1, limit: 20 };
      const expected = {
        data: [mockClient],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockClientsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(result).toBe(expected);
      expect(mockClientsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should pass empty query if none provided', async () => {
      const query = {};
      mockClientsService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await controller.findAll(query);

      expect(mockClientsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /clients/:id', () => {
    it('should return a client', async () => {
      mockClientsService.findOne.mockResolvedValue(mockClient);

      const result = await controller.findOne('client-1');

      expect(result).toBe(mockClient);
      expect(mockClientsService.findOne).toHaveBeenCalledWith('client-1');
    });

    it('should propagate NotFoundException', async () => {
      mockClientsService.findOne.mockRejectedValue(
        new NotFoundException('Client not found'),
      );

      await expect(controller.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /clients/:id/profile', () => {
    it('should return client profile', async () => {
      const profile = {
        ...mockClient,
        _count: { visaCases: 0, internalNotes: 0 },
      };
      mockClientsService.getProfile.mockResolvedValue(profile as any);

      const result = await controller.getProfile('client-1');

      expect(result).toBe(profile);
      expect(mockClientsService.getProfile).toHaveBeenCalledWith('client-1');
    });
  });

  describe('GET /clients/:id/timeline', () => {
    it('should return timeline entries', async () => {
      const timeline = [
        { id: 't1', type: 'CLIENT_CREATED', label: 'Client Created' },
      ];
      mockClientsService.getTimeline.mockResolvedValue(timeline as any);

      const result = await controller.getTimeline('client-1');

      expect(result).toBe(timeline);
      expect(mockClientsService.getTimeline).toHaveBeenCalledWith('client-1');
    });
  });

  describe('GET /clients/:id/stats', () => {
    it('should return stats', async () => {
      const stats = {
        totalApplications: 5,
        approved: 3,
        refused: 1,
        pending: 1,
        approvalRate: 75,
        refusalRate: 25,
        totalCountries: 2,
        countries: [],
        avgProcessingTime: 30,
        upcomingAppointments: [],
        pastAppointments: [],
      };
      mockClientsService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats('client-1');

      expect(result).toBe(stats);
      expect(mockClientsService.getStats).toHaveBeenCalledWith('client-1');
    });
  });

  describe('GET /clients/:id/documents', () => {
    it('should return documents', async () => {
      const docs = [
        {
          id: 'doc-1',
          fileName: 'passport.pdf',
          uploadedAt: new Date(),
          visaCase: {
            caseNumber: 'V-1',
            visaCountry: 'US',
            visaType: 'B1',
          },
        },
      ];
      mockClientsService.getDocuments.mockResolvedValue(docs as any);

      const result = await controller.getDocuments('client-1');

      expect(result).toBe(docs);
      expect(mockClientsService.getDocuments).toHaveBeenCalledWith('client-1');
    });
  });

  describe('PATCH /clients/:id', () => {
    it('should update a client', async () => {
      const dto = { fullName: 'Updated Name' };
      const updated = { ...mockClient, fullName: 'Updated Name' };
      mockClientsService.update.mockResolvedValue(updated);

      const result = await controller.update('client-1', dto, mockUserId);

      expect(result).toBe(updated);
      expect(mockClientsService.update).toHaveBeenCalledWith(
        'client-1',
        dto,
        mockUserId,
      );
    });

    it('should propagate NotFoundException', async () => {
      mockClientsService.update.mockRejectedValue(
        new NotFoundException('Client not found'),
      );

      await expect(
        controller.update('bad-id', { fullName: 'X' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /clients/:id', () => {
    it('should delete a client', async () => {
      mockClientsService.remove.mockResolvedValue(undefined);

      await controller.remove('client-1', mockUserId);

      expect(mockClientsService.remove).toHaveBeenCalledWith(
        'client-1',
        mockUserId,
      );
    });

    it('should propagate NotFoundException', async () => {
      mockClientsService.remove.mockRejectedValue(
        new NotFoundException('Client not found'),
      );

      await expect(
        controller.remove('bad-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
