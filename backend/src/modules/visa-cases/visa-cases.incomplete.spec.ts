import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VisaCasesService } from './visa-cases.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FcmService } from '../notifications/fcm.service';
import { AppGateway } from '../gateway/app.gateway';
import { TemplatesService } from '../templates/templates.service';
import { MessagesService } from '../templates/messages.service';

describe('VisaCasesService.updateStatus — dossier incomplet', () => {
  let service: VisaCasesService;
  let findUnique: jest.Mock;
  let update: jest.Mock;
  let transaction: jest.Mock;

  const existingCase = (over: Record<string, unknown> = {}) => ({
    id: 'v1',
    caseNumber: 'VISA-2026-0001',
    currentStatus: 'EN_ATTENTE',
    incompleteReason: null,
    ...over,
  });

  beforeEach(async () => {
    findUnique = jest.fn().mockResolvedValue(existingCase());
    update = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'v1', ...data }));
    transaction = jest.fn().mockResolvedValue([{ id: 'v1', caseNumber: 'VISA-2026-0001' }]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisaCasesService,
        {
          provide: PrismaService,
          useValue: {
            visaCase: { findUnique, update },
            statusHistory: { create: jest.fn() },
            user: { findUnique: jest.fn().mockResolvedValue({ firstName: 'A', lastName: 'B' }) },
            $transaction: transaction,
          },
        },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
        { provide: NotificationsService, useValue: { broadcast: jest.fn() } },
        { provide: FcmService, useValue: { sendToTopic: jest.fn() } },
        { provide: AppGateway, useValue: { emitToAll: jest.fn() } },
        { provide: TemplatesService, useValue: {} },
        { provide: MessagesService, useValue: {} },
      ],
    }).compile();

    service = module.get<VisaCasesService>(VisaCasesService);
  });

  it('refuses to mark a case incomplete without a motif', async () => {
    await expect(
      service.updateStatus('v1', { status: 'DOSSIER_INCOMPLET' } as never, 'u1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('treats a whitespace-only motif as missing', async () => {
    await expect(
      service.updateStatus('v1', { status: 'DOSSIER_INCOMPLET', reason: '   ' } as never, 'u1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('saves a corrected motif when the status is already incomplete', async () => {
    findUnique.mockResolvedValue(
      existingCase({ currentStatus: 'DOSSIER_INCOMPLET', incompleteReason: 'Reason A' }),
    );

    await service.updateStatus(
      'v1',
      { status: 'DOSSIER_INCOMPLET', reason: 'Reason B' } as never,
      'u1',
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { incompleteReason: 'Reason B' },
    });
    // A corrected motif is not a transition, so it stays out of the history.
    expect(transaction).not.toHaveBeenCalled();
  });

  it('does nothing when the motif is unchanged', async () => {
    findUnique.mockResolvedValue(
      existingCase({ currentStatus: 'DOSSIER_INCOMPLET', incompleteReason: 'Same' }),
    );

    await service.updateStatus(
      'v1',
      { status: 'DOSSIER_INCOMPLET', reason: 'Same' } as never,
      'u1',
    );

    expect(update).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});
