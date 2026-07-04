import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

@Controller('system-logs')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class SystemLogsController {
  @Get()
  async findAll() {
    const logsDir = join(process.cwd(), 'logs');
    const logs: { timestamp: string; level: string; context: string; message: string; trace?: string }[] = [];

    if (!existsSync(logsDir)) return [];

    const files = readdirSync(logsDir)
      .filter((f) => f.endsWith('.log'))
      .sort()
      .slice(-5);

    for (const file of files) {
      const content = readFileSync(join(logsDir, file), 'utf-8');
      const lines = content.split('\n').filter(Boolean).slice(-500);

      for (const line of lines) {
        const match = line.match(/^\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\]\s+(.*)/);
        if (match) {
          logs.push({
            timestamp: match[1],
            level: match[2],
            context: match[3],
            message: match[4],
          });
        } else {
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            context: 'System',
            message: line,
          });
        }
      }
    }

    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 1000);
  }
}
