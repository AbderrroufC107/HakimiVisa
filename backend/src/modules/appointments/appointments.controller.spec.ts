import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { NotFoundException } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let mockAppointmentsService: ReturnType<typeof mockDeep<AppointmentsService>>;

  const mockUserId = 'user-1';
  const mockAppointment = {
    id: 'apt-1',
    visaCaseId: 'vc-1',
    appointmentDate: new Date('2025-06-15'),
    appointmentTime: '10:00',
    appointmentCenter: 'Embassy Paris',
    appointmentType: 'VISA_INTERVIEW',
    notes: null,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockAppointmentsService = mockDeep<AppointmentsService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: AppointmentsService, useValue: mockAppointmentsService },
      ],
    }).compile();
    controller = module.get(AppointmentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Guard protection', () => {
    it('should have @UseGuards(JwtAuthGuard) at class level', () => {
      const guards = Reflect.getMetadata('__guards__', AppointmentsController);
      expect(guards).toBeDefined();
      expect(guards.length).toBe(1);
      expect(guards[0]).toBe(JwtAuthGuard);
    });
  });

  describe('POST /appointments', () => {
    it('should create an appointment', async () => {
      const dto = {
        visaCaseId: 'vc-1',
        appointmentDate: '2025-06-15',
        appointmentTime: '10:00',
        appointmentCenter: 'Embassy Paris',
        appointmentType: 'VISA_INTERVIEW' as any,
        notes: 'Bring passport',
      };
      mockAppointmentsService.create.mockResolvedValue(mockAppointment);

      const result = await controller.create(dto, mockUserId);

      expect(result).toBe(mockAppointment);
      expect(mockAppointmentsService.create).toHaveBeenCalledWith(
        dto,
        mockUserId,
      );
    });

    it('should propagate NotFoundException when visa case missing', async () => {
      mockAppointmentsService.create.mockRejectedValue(
        new NotFoundException('Visa case not found'),
      );

      await expect(
        controller.create(
          {
            visaCaseId: 'bad-id',
            appointmentDate: '2025-06-15',
            appointmentTime: '10:00',
            appointmentCenter: 'Test',
            appointmentType: 'VISA_INTERVIEW' as any,
          },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /appointments', () => {
    it('should return appointments with filters', async () => {
      const query = {
        visaCaseId: 'vc-1',
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
      };
      mockAppointmentsService.findAll.mockResolvedValue([mockAppointment]);

      const result = await controller.findAll(query);

      expect(result).toEqual([mockAppointment]);
      expect(mockAppointmentsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should pass empty query when none provided', async () => {
      const query = {};
      mockAppointmentsService.findAll.mockResolvedValue([]);

      await controller.findAll(query);

      expect(mockAppointmentsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /appointments/:id', () => {
    it('should return an appointment', async () => {
      mockAppointmentsService.findOne.mockResolvedValue(mockAppointment);

      const result = await controller.findOne('apt-1');

      expect(result).toBe(mockAppointment);
      expect(mockAppointmentsService.findOne).toHaveBeenCalledWith('apt-1');
    });

    it('should propagate NotFoundException', async () => {
      mockAppointmentsService.findOne.mockRejectedValue(
        new NotFoundException('Appointment not found'),
      );

      await expect(controller.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /appointments/:id', () => {
    it('should update an appointment', async () => {
      const dto = { appointmentCenter: 'Updated Center' };
      const updated = { ...mockAppointment, appointmentCenter: 'Updated Center' };
      mockAppointmentsService.update.mockResolvedValue(updated);

      const result = await controller.update('apt-1', dto, mockUserId);

      expect(result).toBe(updated);
      expect(mockAppointmentsService.update).toHaveBeenCalledWith(
        'apt-1',
        dto,
        mockUserId,
      );
    });

    it('should propagate NotFoundException', async () => {
      mockAppointmentsService.update.mockRejectedValue(
        new NotFoundException('Appointment not found'),
      );

      await expect(
        controller.update('bad-id', { appointmentCenter: 'X' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /appointments/:id', () => {
    it('should delete an appointment', async () => {
      mockAppointmentsService.remove.mockResolvedValue(undefined);

      await controller.remove('apt-1', mockUserId);

      expect(mockAppointmentsService.remove).toHaveBeenCalledWith(
        'apt-1',
        mockUserId,
      );
    });

    it('should propagate NotFoundException', async () => {
      mockAppointmentsService.remove.mockRejectedValue(
        new NotFoundException('Appointment not found'),
      );

      await expect(
        controller.remove('bad-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
