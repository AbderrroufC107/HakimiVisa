import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream, unlinkSync, existsSync, mkdirSync, statSync, createWriteStream, writeFileSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';

const execAsync = promisify(exec);
const BACKUP_DIR = join(process.cwd(), 'backups');
const XAMPP_MYSQLDUMP = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
type ArchiveInstance = {
  pipe: (stream: NodeJS.WritableStream) => unknown;
  file: (path: string, data: { name: string }) => unknown;
  directory: (path: string, destination: string) => unknown;
  on: (event: 'error', listener: (error: Error) => void) => unknown;
  finalize: () => unknown;
};
type ArchiverFactory = (format: 'zip', options: { zlib: { level: number } }) => ArchiveInstance;
type ZipArchiveConstructor = new (options: { zlib: { level: number } }) => ArchiveInstance;
type ArchiverRuntime = ArchiverFactory | {
  default?: ArchiverFactory;
  ZipArchive?: ZipArchiveConstructor;
};

async function createZipArchive(): Promise<ArchiveInstance> {
  const archiverRuntime = await import('archiver') as unknown as ArchiverRuntime;
  if (typeof archiverRuntime === 'function') {
    return archiverRuntime('zip', { zlib: { level: 5 } });
  }

  if (typeof archiverRuntime.default === 'function') {
    return archiverRuntime.default('zip', { zlib: { level: 5 } });
  }

  const ZipArchive = archiverRuntime.ZipArchive;
  if (!ZipArchive) {
    throw new Error('archiver zip implementation is unavailable');
  }

  return new ZipArchive({ zlib: { level: 5 } });
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private prisma: PrismaService) {
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  async create(userId: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hakimi-backup-${timestamp}.zip`;
    const filepath = join(BACKUP_DIR, filename);

    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) throw new Error('DATABASE_URL not configured');

      const parsed = new URL(dbUrl);
      if (parsed.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql protocol');

      const user = decodeURIComponent(parsed.username);
      const password = decodeURIComponent(parsed.password);
      const host = parsed.hostname;
      const port = parsed.port || '3306';
      const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
      if (!user || !host || !database) throw new Error('DATABASE_URL is missing required fields');

      this.logger.log(`Starting backup: ${filename}`);

      const dumpFile = join(BACKUP_DIR, `dump-${timestamp}.sql`);
      const configFile = join(BACKUP_DIR, `my-${timestamp}.cnf`);
      const configContent = [
        '[client]',
        `host="${host}"`,
        `port=${port}`,
        `user="${user}"`,
        password ? `password="${password}"` : undefined,
        '',
      ].filter((line): line is string => line !== undefined).join('\n');
      writeFileSync(configFile, configContent, { mode: 0o600 });
      const mysqldumpPath = process.env.MYSQLDUMP_PATH
        || (existsSync(XAMPP_MYSQLDUMP) ? XAMPP_MYSQLDUMP : 'mysqldump');
      await execAsync(
        `"${mysqldumpPath}" --defaults-extra-file="${configFile}" "${database}" > "${dumpFile}"`,
      );
      try { unlinkSync(configFile); } catch {}

      const archive = await createZipArchive();
      const output = createWriteStream(filepath);

      await new Promise<void>((resolve, reject) => {
        archive.pipe(output);
        archive.file(dumpFile, { name: `database.sql` });

        const uploadsDir = join(process.cwd(), 'uploads');
        if (existsSync(uploadsDir)) {
          archive.directory(uploadsDir, 'uploads');
        }

        archive.on('error', reject);
        output.on('close', resolve);
        archive.finalize();
      });

      try { unlinkSync(dumpFile); } catch {}

      const stats = statSync(filepath);
      const size = stats.size;

      const backup = await this.prisma.backup.create({
        data: { filename, size, status: 'completed', type: 'manual', createdById: userId },
      });

      this.logger.log(`Backup completed: ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`);
      return backup;
    } catch (err) {
      this.logger.error(`Backup failed: ${filename}`, err instanceof Error ? err.message : undefined);
      const backup = await this.prisma.backup.create({
        data: { filename, size: 0, status: 'failed', type: 'manual', createdById: userId },
      });
      return backup;
    }
  }

  async findAll() {
    return this.prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async download(id: string, res: Response) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException('Backup not found');

    const filepath = join(BACKUP_DIR, backup.filename);
    if (!existsSync(filepath)) throw new NotFoundException('Backup file not found');

    const stats = statSync(filepath);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${backup.filename}"`,
      'Content-Length': stats.size.toString(),
    });

    const stream = createReadStream(filepath);
    stream.pipe(res);
  }

  async remove(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException('Backup not found');

    const filepath = join(BACKUP_DIR, backup.filename);
    try { if (existsSync(filepath)) unlinkSync(filepath); } catch {}

    await this.prisma.backup.delete({ where: { id } });
  }

  async restore(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException('Backup not found');
    throw new BadRequestException('Restore must be performed manually via CLI for safety');
  }

  async getSettings() {
    let settings = await this.prisma.backupSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.backupSettings.create({ data: {} });
    }
    return settings;
  }

  async updateSettings(data: { enabled?: boolean; frequency?: string; time?: string; retentionDays?: number; maxBackups?: number }) {
    let settings = await this.prisma.backupSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.backupSettings.create({ data });
    } else {
      settings = await this.prisma.backupSettings.update({ where: { id: settings.id }, data });
    }
    return settings;
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup() {
    const settings = await this.getSettings();
    if (!settings.enabled) return;

    this.logger.log('Starting scheduled backup');
    const systemUser = await this.prisma.user.findFirst({
      where: { isActive: true, role: 'ADMIN' },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    }) ?? await this.prisma.user.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!systemUser) {
      this.logger.error('Scheduled backup skipped: no active user available for ownership');
      return;
    }

    await this.create(systemUser.id);

    await this.enforceRetention(settings);
  }

  private async enforceRetention(settings: { retentionDays: number; maxBackups: number }) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - settings.retentionDays);

    const oldBackups = await this.prisma.backup.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true, filename: true },
    });

    for (const b of oldBackups) {
      const fp = join(BACKUP_DIR, b.filename);
      try { if (existsSync(fp)) unlinkSync(fp); } catch {}
      await this.prisma.backup.delete({ where: { id: b.id } });
    }

    const allBackups = await this.prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, filename: true },
    });

    if (allBackups.length > settings.maxBackups) {
      const toDelete = allBackups.slice(settings.maxBackups);
      for (const b of toDelete) {
        const fp = join(BACKUP_DIR, b.filename);
        try { if (existsSync(fp)) unlinkSync(fp); } catch {}
        await this.prisma.backup.delete({ where: { id: b.id } });
      }
    }
  }
}
