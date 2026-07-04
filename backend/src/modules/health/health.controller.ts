import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async check() {
    const checks: Record<string, unknown> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok' };
    } catch {
      checks.database = { status: 'error' };
    }

    checks.nodeVersion = process.version;
    checks.environment = process.env.NODE_ENV ?? 'development';
    checks.uptime = process.uptime();
    checks.memory = process.memoryUsage();
    checks.platform = process.platform;
    checks.appVersion = '0.1.0';

    return checks;
  }

  @Public()
  @Get('live')
  async live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch {
      return { status: 'error', database: 'disconnected' };
    }
  }
}
