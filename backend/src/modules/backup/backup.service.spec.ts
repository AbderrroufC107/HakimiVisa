import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BackupService } from './backup.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter } from 'events';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  createWriteStream: jest.fn(),
  statSync: jest.fn(),
  createReadStream: jest.fn(),
}));

jest.mock('child_process', () => ({
  exec: jest.fn((...args: unknown[]) => {
    const cb = args.find((a): a is Function => typeof a === 'function');
    if (cb) process.nextTick(() => cb(null, { stdout: '', stderr: '' }));
    return { stdout: '', stderr: '' };
  }),
}));

jest.mock('archiver', () => {
  const mockArchive = {
    pipe: jest.fn(),
    file: jest.fn(),
    directory: jest.fn(),
    on: jest.fn(),
    finalize: jest.fn(),
  };
  return jest.fn(() => mockArchive);
});

describe('BackupService', () => {
  let service: BackupService;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaService>>;

  const fs = require('fs');
  const childProcess = require('child_process');
  const archiverMock = require('archiver');

  const mockBackupRecord = {
    id: 'backup-1',
    filename: 'hakimi-backup-2025-06-27T00-00-00-000Z.zip',
    size: 1024,
    status: 'completed',
    type: 'manual',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFailedBackup = {
    id: 'backup-2',
    filename: 'hakimi-backup-2025-06-27T00-00-00-000Z.zip',
    size: 0,
    status: 'failed',
    type: 'manual',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBackupSettings = {
    id: 'settings-1',
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retentionDays: 30,
    maxBackups: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
    (fs.createWriteStream as jest.Mock).mockReturnValue(new EventEmitter());
    process.env.DATABASE_URL = 'mysql://root:pass@localhost:3306/hakimi_visa';

    mockPrisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(BackupService);
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe('create', () => {
    it('should create a backup successfully', async () => {
      const mockOutputStream = new EventEmitter();
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockOutputStream);
      const mockArchiveInstance = (archiverMock as jest.Mock)();
      mockArchiveInstance.finalize.mockImplementation(() => {
        mockOutputStream.emit('close');
        return Promise.resolve();
      });
      mockPrisma.backup.create.mockResolvedValue(mockBackupRecord);

      const result = await service.create('user-1');
      expect(result).toBe(mockBackupRecord);
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(childProcess.exec).toHaveBeenCalled();
      expect(fs.createWriteStream).toHaveBeenCalled();
      expect(mockArchiveInstance.file).toHaveBeenCalled();
      expect(mockPrisma.backup.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filename: expect.stringContaining('hakimi-backup'),
          status: 'completed',
          type: 'manual',
          createdById: 'user-1',
        }),
      });
    });

    it('should create a failed backup record when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL;
      mockPrisma.backup.create.mockResolvedValue(mockFailedBackup);

      const result = await service.create('user-1');
      expect(result.status).toBe('failed');
    });

    it('should create a failed backup record when mysqldump fails', async () => {
      childProcess.exec.mockImplementationOnce((...args: unknown[]) => {
        const cb = args.find((a): a is Function => typeof a === 'function');
        if (cb) process.nextTick(() => cb(new Error('mysqldump failed')));
      });
      mockPrisma.backup.create.mockResolvedValue(mockFailedBackup);

      const result = await service.create('user-1');
      expect(result.status).toBe('failed');
    });

    it('should handle archiver errors gracefully', async () => {
      const mockOutputStream = new EventEmitter();
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockOutputStream);
      const mockArchiveInstance = (archiverMock as jest.Mock)();
      mockArchiveInstance.on.mockImplementation((event: string, cb: Function) => {
        if (event === 'error') process.nextTick(() => cb(new Error('Archive error')));
        return mockArchiveInstance;
      });
      mockPrisma.backup.create.mockResolvedValue(mockFailedBackup);

      const result = await service.create('user-1');
      expect(result.status).toBe('failed');
    });

    it('should propagate error when both operation and fallback fail', async () => {
      delete process.env.DATABASE_URL;
      mockPrisma.backup.create.mockRejectedValue(new Error('DB insert failed'));
      await expect(service.create('user-1')).rejects.toThrow('DB insert failed');
    });

    it('should clean up config file after dump', async () => {
      const mockOutputStream = new EventEmitter();
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockOutputStream);
      const mockArchiveInstance = (archiverMock as jest.Mock)();
      mockArchiveInstance.finalize.mockImplementation(() => {
        mockOutputStream.emit('close');
        return Promise.resolve();
      });
      mockPrisma.backup.create.mockResolvedValue(mockBackupRecord);

      await service.create('user-1');
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('.cnf'),
      );
    });
  });

  describe('findAll', () => {
    it('should return all backups ordered by creation date desc', async () => {
      const expected = [mockBackupRecord];
      mockPrisma.backup.findMany.mockResolvedValue(expected);

      const result = await service.findAll();
      expect(result).toBe(expected);
      expect(mockPrisma.backup.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
      });
    });
  });

  describe('download', () => {
    it('should stream backup file when found', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(mockBackupRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
      const mockStream = { pipe: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);
      const mockRes = { set: jest.fn() } as any;

      await service.download('backup-1', mockRes);
      expect(mockRes.set).toHaveBeenCalled();
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it('should throw NotFoundException when backup record not found', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(null);
      await expect(service.download('invalid', {} as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when file does not exist on disk', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(mockBackupRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await expect(service.download('backup-1', {} as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete backup record and file when found', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(mockBackupRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.remove('backup-1');
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(mockPrisma.backup.delete).toHaveBeenCalledWith({ where: { id: 'backup-1' } });
    });

    it('should throw NotFoundException when backup not found', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(null);
      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should not throw if file already deleted from disk', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(mockBackupRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      fs.unlinkSync.mockImplementation(() => { throw new Error('not found'); });

      await expect(service.remove('backup-1')).resolves.not.toThrow();
      expect(mockPrisma.backup.delete).toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should throw BadRequestException', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(mockBackupRecord);
      await expect(service.restore('backup-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when backup not found', async () => {
      mockPrisma.backup.findUnique.mockResolvedValue(null);
      await expect(service.restore('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSettings', () => {
    it('should return existing settings', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValue(mockBackupSettings);
      const result = await service.getSettings();
      expect(result).toBe(mockBackupSettings);
    });

    it('should create default settings when none exist', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValue(null);
      mockPrisma.backupSettings.create.mockResolvedValue(mockBackupSettings);
      const result = await service.getSettings();
      expect(result).toBe(mockBackupSettings);
      expect(mockPrisma.backupSettings.create).toHaveBeenCalledWith({ data: {} });
    });
  });

  describe('updateSettings', () => {
    const data = { enabled: true, frequency: 'weekly', retentionDays: 15, maxBackups: 5 };

    it('should create settings when none exist', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValue(null);
      mockPrisma.backupSettings.create.mockResolvedValue({ id: 'new', ...data, createdAt: new Date(), updatedAt: new Date() });

      const result = await service.updateSettings(data);
      expect(mockPrisma.backupSettings.create).toHaveBeenCalledWith({ data });
    });

    it('should update existing settings', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValue(mockBackupSettings);
      const updated = { ...mockBackupSettings, ...data };
      mockPrisma.backupSettings.update.mockResolvedValue(updated);

      const result = await service.updateSettings(data);
      expect(result).toBe(updated);
      expect(mockPrisma.backupSettings.update).toHaveBeenCalledWith({
        where: { id: 'settings-1' },
        data,
      });
    });
  });

  describe('scheduledBackup', () => {
    it('should run backup when settings enabled', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValue(mockBackupSettings);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'admin-1' } as any);
      const mockOutputStream = new EventEmitter();
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockOutputStream);
      const mockArchive = (archiverMock as jest.Mock)();
      mockArchive.finalize.mockImplementation(() => {
        mockOutputStream.emit('close');
        return Promise.resolve();
      });
      mockPrisma.backup.create.mockResolvedValue(mockBackupRecord);
      mockPrisma.backup.findMany.mockResolvedValue([]);

      await service.scheduledBackup();
      expect(mockPrisma.backup.create).toHaveBeenCalled();
    });

    it('should skip backup when settings disabled', async () => {
      mockPrisma.backupSettings.findFirst.mockResolvedValue({
        ...mockBackupSettings,
        enabled: false,
      });

      await service.scheduledBackup();
      expect(mockPrisma.backup.create).not.toHaveBeenCalled();
    });
  });

  describe('enforceRetention', () => {
    it('should delete old backups and excess backups', async () => {
      const oldBackups = [
        { id: 'old-1', filename: 'old-1.zip' },
        { id: 'old-2', filename: 'old-2.zip' },
      ];
      const allBackups = [
        { id: 'recent-1', filename: 'recent-1.zip' },
        { id: 'recent-2', filename: 'recent-2.zip' },
        { id: 'recent-3', filename: 'recent-3.zip' },
        { id: 'old-1', filename: 'old-1.zip' },
        { id: 'old-2', filename: 'old-2.zip' },
      ];

      mockPrisma.backup.findMany
        .mockResolvedValueOnce(oldBackups)
        .mockResolvedValueOnce(allBackups);

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await (service as any).enforceRetention({ retentionDays: 30, maxBackups: 3 });

      expect(mockPrisma.backup.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'old-1' } }),
      );
      expect(mockPrisma.backup.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'old-2' } }),
      );
    });
  });
});
