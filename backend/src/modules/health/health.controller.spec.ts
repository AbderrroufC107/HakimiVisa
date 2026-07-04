import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { HealthController } from './health.controller';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaService>>;

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    controller = module.get(HealthController);
  });

  describe('check', () => {
    it('should return database ok and node info when db responds', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      const result = await controller.check();
      expect(result.database).toEqual({ status: 'ok' });
      expect(result.nodeVersion).toBe(process.version);
      expect(result.environment).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.platform).toBe(process.platform);
      expect(result.appVersion).toBe('0.1.0');
    });

    it('should return database error when query fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('db down'));
      const result = await controller.check();
      expect(result.database).toEqual({ status: 'error' });
    });
  });

  describe('live', () => {
    it('should return status ok with timestamp', async () => {
      const result = await controller.live();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('ready', () => {
    it('should return ok when database is connected', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      const result = await controller.ready();
      expect(result).toEqual({ status: 'ok', database: 'connected' });
    });

    it('should return error when database is disconnected', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('db down'));
      const result = await controller.ready();
      expect(result).toEqual({ status: 'error', database: 'disconnected' });
    });
  });
});
