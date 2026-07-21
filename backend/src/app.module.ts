import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VisaCasesModule } from './modules/visa-cases/visa-cases.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { VisaDetailsModule } from './modules/visa-details/visa-details.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { PublicTrackingModule } from './modules/public-tracking/public-tracking.module';
import { BulkModule } from './modules/bulk/bulk.module';
import { BackupModule } from './modules/backup/backup.module';
import { HealthModule } from './modules/health/health.module';
import { SystemLogsModule } from './modules/system-logs/system-logs.module';
import { AgencySettingsModule } from './modules/agency-settings/agency-settings.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { NotesModule } from './modules/notes/notes.module';
import { RefDataModule } from './modules/ref-data/ref-data.module';
import { SearchModule } from './modules/search/search.module';
import { VisaExpirationModule } from './modules/visa-expiration/visa-expiration.module';
import { ExcelModule } from './modules/excel/excel.module';
import { FilesModule } from './modules/files/files.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { LoggerModule } from './logger/logger.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10000,
      },
    ]),
    PrismaModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    VisaCasesModule,
    KanbanModule,
    VisaDetailsModule,
    AppointmentsModule,
    NotificationsModule,
    AgencySettingsModule,
    GatewayModule,
    NotesModule,
    RefDataModule,
    VisaExpirationModule,
    ExcelModule,
    FilesModule,
    TemplatesModule,
    SearchModule,
    AuditLogsModule,
    PdfModule,
    TrackingModule,
    PublicTrackingModule,
    BulkModule,
    BackupModule,
    HealthModule,
    SystemLogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
