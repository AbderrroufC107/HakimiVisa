import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppGateway } from '../gateway/app.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaService>>;
  let mockGateway: ReturnType<typeof mockDeep<AppGateway>>;

  const mockNotification = {
    id: 'notif-1',
    type: 'STATUS_CHANGE',
    title: 'Case Updated',
    message: 'Test message',
    userId: 'user-1',
    read: false,
    link: '/visa-cases/case-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaService>();
    mockGateway = mockDeep<AppGateway>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AppGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  describe('create', () => {
    it('should create notification and emit via gateway', async () => {
      const dto = {
        type: 'STATUS_CHANGE' as const,
        title: 'Case Updated',
        message: 'Test message',
        userId: 'user-1',
        link: '/visa-cases/case-1',
      };
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(dto);
      expect(result).toBe(mockNotification);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({ data: dto });
      expect(mockGateway.sendToUser).toHaveBeenCalledWith('user-1', 'notification', mockNotification);
    });
  });

  describe('findByUser', () => {
    const mockNotifications = [mockNotification];
    const defaultQuery = { page: 1, limit: 20 };

    it('should return paginated notifications for user', async () => {
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      const result = await service.findByUser('user-1', defaultQuery);
      expect(result.data).toEqual(mockNotifications);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.unreadCount).toBe(0);
    });

    it('should filter by read status when provided', async () => {
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValue(1);

      await service.findByUser('user-1', { ...defaultQuery, read: false });
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', read: false },
        }),
      );
    });

    it('should apply pagination skip correctly', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(50);

      await service.findByUser('user-1', { page: 3, limit: 10 });
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should use default pagination when not provided', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.findByUser('user-1', {});
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should update notification where id and userId match', async () => {
      const expected = { count: 1 };
      mockPrisma.notification.updateMany.mockResolvedValue(expected as any);

      const result = await service.markAsRead('notif-1', 'user-1');
      expect(result).toBe(expected);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { read: true },
      });
    });

    it('should return count 0 when notification not found', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 } as any);
      const result = await service.markAsRead('invalid', 'user-1');
      expect(result.count).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const expected = { count: 5 };
      mockPrisma.notification.updateMany.mockResolvedValue(expected as any);

      const result = await service.markAllAsRead('user-1');
      expect(result).toBe(expected);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
      });
    });
  });

  describe('remove', () => {
    it('should delete notification where id and userId match', async () => {
      const expected = { count: 1 };
      mockPrisma.notification.deleteMany.mockResolvedValue(expected as any);

      const result = await service.remove('notif-1', 'user-1');
      expect(result).toBe(expected);
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
    });

    it('should return count 0 when notification not found', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 } as any);
      const result = await service.remove('invalid', 'user-1');
      expect(result.count).toBe(0);
    });
  });
});
