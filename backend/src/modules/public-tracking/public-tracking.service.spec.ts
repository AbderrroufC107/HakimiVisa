import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mockDeep } from 'jest-mock-extended';
import { PublicTrackingService } from './public-tracking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { row } from '../../test-utils/prisma-row';

describe('PublicTrackingService', () => {
  let service: PublicTrackingService;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaService>>;

  const client = {
    id: 'client-1',
    fullName: 'Client One',
    phoneNumber: '0664618172',
    passportNumber: 'P123',
    passportExpiry: new Date('2030-01-01T00:00:00.000Z'),
  };

  const visaCases = [
    {
      id: 'case-1',
      caseNumber: 'VISA-2026-0001',
      visaCountry: 'Chine',
      visaType: 'Touristique',
      currentStatus: 'DOSSIER_INCOMPLET',
      incompleteReason: 'Missing document',
      openingDate: new Date('2026-08-10T00:00:00.000Z'),
      updatedAt: new Date('2026-08-10T01:00:00.000Z'),
    },
  ];

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicTrackingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(PublicTrackingService);
  });

  it('rejects empty public tracking queries', async () => {
    await expect(service.findByPassport({})).rejects.toThrow(BadRequestException);
  });

  it('finds a client by phone even when local and international formats differ', async () => {
    mockPrisma.client.findMany.mockResolvedValue(row([client]));
    mockPrisma.visaCase.findMany.mockResolvedValue(row(visaCases));

    const result = await service.findByPassport({ phone: '+213664618172' });

    expect(result.clientName).toBe('Client One');
    expect(result.total).toBe(1);
    expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { phoneNumber: { contains: '0664618172' } },
            { phoneNumber: { contains: '213664618172' } },
          ]),
        }),
      }),
    );
  });

  it('throws not found when no phone candidate matches a client', async () => {
    mockPrisma.client.findMany.mockResolvedValue([]);

    await expect(service.findByPassport({ phone: '0550806116' })).rejects.toThrow(NotFoundException);
  });
});
