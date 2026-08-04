import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';

describe('ClientsService.update passportExpiry', () => {
  let service: ClientsService;
  let update: jest.Mock;

  beforeEach(async () => {
    update = jest.fn().mockResolvedValue({ id: 'c1', fullName: 'A' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              findUnique: jest.fn().mockResolvedValue({ id: 'c1' }),
              update,
            },
          },
        },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  const dataOf = () => update.mock.calls[0][0].data;

  it('converts the date-only value a date input sends into a Date', async () => {
    // Prisma rejects "2027-01-01" outright: it wants a full ISO DateTime.
    await service.update('c1', { passportExpiry: '2027-01-01' }, 'u1');

    expect(dataOf().passportExpiry).toBeInstanceOf(Date);
    expect((dataOf().passportExpiry as Date).toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('still accepts a full ISO timestamp', async () => {
    await service.update('c1', { passportExpiry: '2029-03-15T00:00:00.000Z' }, 'u1');

    expect((dataOf().passportExpiry as Date).toISOString()).toBe('2029-03-15T00:00:00.000Z');
  });

  it('clears the expiry when an empty value is sent', async () => {
    await service.update('c1', { passportExpiry: '' }, 'u1');

    expect(dataOf().passportExpiry).toBeNull();
  });

  it('leaves the stored expiry alone when the field is absent', async () => {
    await service.update('c1', { fullName: 'B' }, 'u1');

    expect(dataOf()).not.toHaveProperty('passportExpiry');
    expect(dataOf().fullName).toBe('B');
  });
});
