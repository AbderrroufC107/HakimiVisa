import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let mockService: ReturnType<typeof mockDeep<NotificationsService>>;

  const mockUser = { id: 'user-1', email: 'test@test.com' };
  const mockNotification = {
    id: 'notif-1',
    type: 'STATUS_CHANGE',
    title: 'Case Updated',
    message: 'Test',
    userId: 'user-1',
    read: false,
    link: '/visa-cases/case-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockService = mockDeep<NotificationsService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compile();
    controller = module.get(NotificationsController);
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = {
        type: 'STATUS_CHANGE' as const,
        title: 'Case Updated',
        message: 'Test',
        userId: 'user-1',
      };
      mockService.create.mockResolvedValue(mockNotification);

      const result = await controller.create(dto);
      expect(result).toBe(mockNotification);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findByUser with user id and query', async () => {
      const query = { page: 1, limit: 20 };
      const expected = { data: [mockNotification], meta: { total: 1, page: 1, limit: 20, totalPages: 1, unreadCount: 0 } };
      mockService.findByUser.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser as any, query);
      expect(result).toBe(expected);
      expect(mockService.findByUser).toHaveBeenCalledWith('user-1', query);
    });
  });

  describe('getUnreadCount', () => {
    it('should call service.getUnreadCount with user id', async () => {
      mockService.getUnreadCount.mockResolvedValue(3);

      const result = await controller.getUnreadCount(mockUser as any);
      expect(result).toBe(3);
      expect(mockService.getUnreadCount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('should call service.markAsRead with id and user id', async () => {
      mockService.markAsRead.mockResolvedValue({ count: 1 } as any);

      const result = await controller.markAsRead('notif-1', mockUser as any);
      expect(mockService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
    });
  });

  describe('markAllAsRead', () => {
    it('should call service.markAllAsRead with user id', async () => {
      mockService.markAllAsRead.mockResolvedValue({ count: 5 } as any);

      const result = await controller.markAllAsRead(mockUser as any);
      expect(mockService.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('remove', () => {
    it('should call service.remove with id and user id', async () => {
      mockService.remove.mockResolvedValue({ count: 1 } as any);

      const result = await controller.remove('notif-1', mockUser as any);
      expect(mockService.remove).toHaveBeenCalledWith('notif-1', 'user-1');
    });
  });
});
