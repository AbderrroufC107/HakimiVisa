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
        {
          provide: PrismaService,
          useValue: {
            client: { count: clientCount },
            visaCase: { count: visaCaseCount },
          },
        },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('counts every record when no range is supplied', async () => {
    await service.getDashboardStats();

    expect(clientCount).toHaveBeenCalledWith({ where: {} });
    // Status counts carry the status alone, with no createdAt bound.
    expect(visaCaseCount).toHaveBeenCalledWith({
      where: { currentStatus: 'EN_ATTENTE' },
    });
  });

  it('bounds clients and every status count by the supplied range', async () => {
    const dateFrom = '2026-08-03T00:00:00.000Z';
    const dateTo = '2026-08-03T23:59:59.999Z';

    await service.getDashboardStats({ dateFrom, dateTo });

    const createdAt = { gte: new Date(dateFrom), lte: new Date(dateTo) };

    expect(clientCount).toHaveBeenCalledWith({ where: { createdAt } });
    expect(visaCaseCount).toHaveBeenCalledWith({ where: { createdAt } });
    expect(visaCaseCount).toHaveBeenCalledWith({
      where: { currentStatus: 'VISA_OK', createdAt },
    });
    expect(visaCaseCount).toHaveBeenCalledWith({
      where: { currentStatus: 'VISA_REFUSEE', createdAt },
    });
    expect(visaCaseCount).toHaveBeenCalledWith({
      where: { currentStatus: 'RDV_OK', createdAt },
    });
  });

  it('accepts an open-ended range', async () => {
    const dateFrom = '2026-08-01T00:00:00.000Z';

    await service.getDashboardStats({ dateFrom });

    expect(clientCount).toHaveBeenCalledWith({
      where: { createdAt: { gte: new Date(dateFrom) } },
    });
  });
});
