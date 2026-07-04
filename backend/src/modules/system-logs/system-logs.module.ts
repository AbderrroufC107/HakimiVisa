import { Module } from '@nestjs/common';
import { SystemLogsController } from './system-logs.controller';

@Module({
  controllers: [SystemLogsController],
})
export class SystemLogsModule {}
