import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';

describe('ClientsService.getDashboardStats date range', () => {
  let service: ClientsService;
  let clientCount: jest.Mock;
  let visaCaseCount: jest.Mock;

  beforeEach(async () => {
    clientCount = jest.fn().mockResolvedValue(0);
    visaCaseCount = jest.fn().mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: { client: { count: clientCount }, visaCase: { count: visaCaseCount } } },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('excludes archived cases from every case dashboard count', async () => {
    await service.getDashboardStats();

    expect(clientCount).toHaveBeenCalledWith({ where: {} });
    expect(visaCaseCount).toHaveBeenCalledWith({ where: { archived: false } });
    expect(visaCaseCount).toHaveBeenCalledWith({ where: { currentStatus: 'RDV_OK', archived: false } });
    expect(visaCaseCount).toHaveBeenCalledWith({ where: { currentStatus: 'LIVREE', archived: false } });
  });

  it('adds the supplied range to clients and active cases', async () => {
    const dateFrom = '2026-08-03T00:00:00.000Z';
    const dateTo = '2026-08-03T23:59:59.999Z';
    const createdAt = { gte: new Date(dateFrom), lte: new Date(dateTo) };

    await service.getDashboardStats({ dateFrom, dateTo });

    expect(clientCount).toHaveBeenCalledWith({ where: { createdAt } });
    expect(visaCaseCount).toHaveBeenCalledWith({ where: { currentStatus: 'RDV_OK', createdAt, archived: false } });
    expect(visaCaseCount).toHaveBeenCalledWith({ where: { currentStatus: 'LIVREE', createdAt, archived: false } });
  });
});
