import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

describe('BackupController', () => {
  let controller: BackupController;
  let mockService: ReturnType<typeof mockDeep<BackupService>>;

  const mockBackup = {
    id: 'backup-1',
    filename: 'hakimi-backup.zip',
    size: 1024,
    status: 'completed',
    type: 'manual',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockService = mockDeep<BackupService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [{ provide: BackupService, useValue: mockService }],
    }).compile();
    controller = module.get(BackupController);
  });

  describe('create', () => {
    it('should call service.create with userId', async () => {
      mockService.create.mockResolvedValue(mockBackup);

      const result = await controller.create('user-1');
      expect(result).toBe(mockBackup);
      expect(mockService.create).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const expected = [mockBackup];
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();
      expect(result).toBe(expected);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('getSettings', () => {
    it('should call service.getSettings', async () => {
      const expected = { id: 'settings-1', enabled: true };
      mockService.getSettings.mockResolvedValue(expected as any);

      const result = await controller.getSettings();
      expect(result).toBe(expected);
      expect(mockService.getSettings).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('should call service.updateSettings with data', async () => {
      const data = { enabled: true, retentionDays: 30 };
      const expected = { id: 'settings-1', ...data };
      mockService.updateSettings.mockResolvedValue(expected as any);

      const result = await controller.updateSettings(data);
      expect(result).toBe(expected);
      expect(mockService.updateSettings).toHaveBeenCalledWith(data);
    });
  });

  describe('download', () => {
    it('should call service.download with id and response', async () => {
      const mockRes = {} as any;
      mockService.download.mockResolvedValue(undefined);

      await controller.download('backup-1', mockRes);
      expect(mockService.download).toHaveBeenCalledWith('backup-1', mockRes);
    });
  });

  describe('restore', () => {
    it('should call service.restore with id', async () => {
      const expected = { message: 'Restore must be performed manually' };
      mockService.restore.mockResolvedValue(expected as any);

      const result = await controller.restore('backup-1');
      expect(result).toBe(expected);
      expect(mockService.restore).toHaveBeenCalledWith('backup-1');
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('backup-1');
      expect(mockService.remove).toHaveBeenCalledWith('backup-1');
    });
  });
});
