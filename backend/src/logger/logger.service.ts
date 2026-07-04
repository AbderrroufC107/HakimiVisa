import { Injectable, LoggerService } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logDir: string;

  constructor() {
    this.logDir = join(process.cwd(), 'logs');
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private write(level: string, message: string, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] [${context ?? 'Application'}] ${message}\n`;
    const filename = `${new Date().toISOString().split('T')[0]}.log`;
    const filepath = join(this.logDir, filename);

    try {
      appendFileSync(filepath, logLine);
    } catch {}

    if (level === 'ERROR') {
      console.error(logLine.trim());
      if (trace) {
        console.error(trace);
        try {
          appendFileSync(filepath, `${trace}\n`);
        } catch {}
      }
    } else {
      console.log(logLine.trim());
    }
  }

  log(message: string, context?: string) {
    this.write('LOG', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.write('ERROR', message, context, trace);
  }

  warn(message: string, context?: string) {
    this.write('WARN', message, context);
  }

  debug(message: string, context?: string) {
    this.write('DEBUG', message, context);
  }

  verbose(message: string, context?: string) {
    this.write('VERBOSE', message, context);
  }
}
