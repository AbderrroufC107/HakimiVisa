import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { BadRequestException } from '@nestjs/common';
import { BulkService } from './bulk.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppGateway } from '../gateway/app.gateway';
import { PdfService } from '../pdf/pdf.service';
import { ExcelService } from '../excel/excel.service';

describe('BulkService', () => {
  let service: BulkService;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaService>>;
  let mockAuditLog: ReturnType<typeof mockDeep<AuditLogService>>;
  let mockNotifications: ReturnType<typeof mockDeep<NotificationsService>>;
  let mockGateway: ReturnType<typeof mockDeep<AppGateway>>;
  let mockPdfService: ReturnType<typeof mockDeep<PdfService>>;
  let mockExcelService: ReturnType<typeof mockDeep<ExcelService>>;

  const mockCases = [
    { id: 'case-1', caseNumber: 'VC-001', currentStatus: 'EN_ATTENTE', clientId: 'client-1' },
    { id: 'case-2', caseNumber: 'VC-002', currentStatus: 'EN_TRAITEMENT', clientId: 'client-2' },
  ];
  const mockClients = [
    { id: 'client-1', fullName: 'John Doe' },
    { id: 'client-2', fullName: 'Jane Smith' },
  ];

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaService>();
    mockAuditLog = mockDeep<AuditLogService>();
    mockNotifications = mockDeep<NotificationsService>();
    mockGateway = mockDeep<AppGateway>();
    mockPdfService = mockDeep<PdfService>();
    mockExcelService = mockDeep<ExcelService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AppGateway, useValue: mockGateway },
        { provide: PdfService, useValue: mockPdfService },
        { provide: ExcelService, useValue: mockExcelService },
      ],
    }).compile();
    service = module.get(BulkService);
  });

  describe('statusChange', () => {
    it('should process status changes in batches and broadcast', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases);
      mockPrisma.client.findMany.mockResolvedValue(mockClients);
      mockPrisma.$transaction.mockResolvedValue([{ id: 'case-1' }, { id: 'case-1-history' }]);

      const result = await service.statusChange(
        { ids: ['case-1', 'case-2'], status: 'VISA_OK' },
        'user-1',
      );

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
      expect(mockAuditLog.log).toHaveBeenCalledTimes(2);
      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
      expect(mockGateway.broadcast).toHaveBeenCalledWith('bulk:statusChangeComplete', {
        count: 2,
        status: 'VISA_OK',
      });
    });

    it('should skip cases already in the target status', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([
        { id: 'case-1', caseNumber: 'VC-001', currentStatus: 'VISA_OK', clientId: 'client-1' },
      ]);
      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const result = await service.statusChange(
        { ids: ['case-1'], status: 'VISA_OK' },
        'user-1',
      );

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should continue processing on individual errors', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases);
      mockPrisma.client.findMany.mockResolvedValue(mockClients);
      mockPrisma.$transaction.mockResolvedValue([{ id: 'case-1'}]);
      mockNotifications.create
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('DB error'));

      const result = await service.statusChange(
        { ids: ['case-1', 'case-2'], status: 'VISA_OK' },
        'user-1',
      );

      expect(result.total).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.items[1].success).toBe(false);
    });

    it('should throw BadRequestException when no cases found', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([]);
      await expect(service.statusChange({ ids: ['invalid'], status: 'VISA_OK' }, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should process more than BATCH_SIZE cases in batches', async () => {
      const manyCases = Array.from({ length: 120 }, (_, i) => ({
        id: `case-${i}`,
        caseNumber: `VC-${String(i).padStart(3, '0')}`,
        currentStatus: 'EN_ATTENTE',
        clientId: `client-${i % 10}`,
      }));
      const manyClients = Array.from({ length: 10 }, (_, i) => ({
        id: `client-${i}`,
        fullName: `Client ${i}`,
      }));
      mockPrisma.visaCase.findMany.mockResolvedValue(manyCases);
      mockPrisma.client.findMany.mockResolvedValue(manyClients);
      mockPrisma.$transaction.mockResolvedValue([{ id: 'updated' }, { id: 'history' }]);

      const result = await service.statusChange(
        { ids: manyCases.map((c) => c.id), status: 'VISA_OK' },
        'user-1',
      );

      expect(result.total).toBe(120);
      expect(result.successful).toBe(120);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(120);
    });
  });

  describe('createAppointments', () => {
    const dto = {
      ids: ['case-1', 'case-2'],
      appointmentDate: '2025-07-15',
      appointmentTime: '10:00',
      appointmentCenter: 'Alger Centre',
      appointmentType: 'TLS' as const,
      notes: 'Bulk appointment',
    };

    it('should create appointments for all cases', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases.map(({ clientId, ...rest }) => rest));
      mockPrisma.appointment.create.mockResolvedValue({ id: 'apt-1' });

      const result = await service.createAppointments(dto, 'user-1');
      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(mockPrisma.appointment.create).toHaveBeenCalledTimes(2);
      expect(mockAuditLog.log).toHaveBeenCalledTimes(2);
      expect(mockGateway.broadcast).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when no cases found', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([]);
      await expect(service.createAppointments(dto, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should continue on individual creation errors', async () => {
      const callLog: string[] = [];
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCases.map(({ clientId, ...rest }) => rest));
      (mockPrisma.appointment.create as jest.Mock)
        .mockImplementationOnce(() => {
          callLog.push('first');
          return Promise.resolve({ id: 'apt-1' });
        })
        .mockImplementationOnce(() => {
          callLog.push('second');
          return Promise.reject(new Error('Constraint error'));
        });

      const result = await service.createAppointments(dto, 'user-1');
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(callLog).toEqual(['first', 'second']);
    });
  });

  describe('exportPdf', () => {
    it('should stream a zip archive with generated PDFs', async () => {
      const mockRes = {
        set: jest.fn(),
      } as any;
      mockPrisma.visaCase.findMany.mockResolvedValue(
        mockCases.map(({ clientId, currentStatus, ...rest }) => rest),
      );
      mockPdfService.generateBordereauBuffer
        .mockResolvedValueOnce(Buffer.from('pdf1'))
        .mockResolvedValueOnce(Buffer.from('pdf2'));

      jest.mock('archiver', () => {
        const mockArchive = {
          pipe: jest.fn(),
          append: jest.fn(),
          on: jest.fn(),
          finalize: jest.fn().mockResolvedValue(undefined),
        };
        return jest.fn(() => mockArchive);
      });

      await service.exportPdf({ ids: ['case-1', 'case-2'] }, mockRes);
      expect(mockRes.set).toHaveBeenCalled();
      expect(mockPdfService.generateBordereauBuffer).toHaveBeenCalledTimes(2);
    });

    it('should continue when PDF generation fails for a case', async () => {
      const mockRes = {
        set: jest.fn(),
      } as any;
      mockPrisma.visaCase.findMany.mockResolvedValue(
        mockCases.slice(0, 1).map(({ clientId, currentStatus, ...rest }) => rest),
      );
      mockPdfService.generateBordereauBuffer.mockRejectedValue(new Error('PDF error'));

      await service.exportPdf({ ids: ['case-1'] }, mockRes);
      expect(mockPdfService.generateBordereauBuffer).toHaveBeenCalledTimes(1);
    });

    it('should throw when no cases found', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([]);
      await expect(service.exportPdf({ ids: ['invalid'] }, {} as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('exportExcel', () => {
    it('should return a workbook buffer', async () => {
      const mockCasesWithClient = mockCases.map((c) => ({
        ...c,
        client: { fullName: 'John Doe', phoneNumber: '+213600000000', passportNumber: 'AB123', nationality: 'Algerian' },
        visaCountry: 'France',
        visaType: 'TOURIST',
        openingDate: new Date('2025-01-01'),
        createdAt: new Date('2025-01-15'),
      }));
      mockPrisma.visaCase.findMany.mockResolvedValue(mockCasesWithClient as any);
      mockExcelService.buildWorkbook.mockResolvedValue(Buffer.from('excel'));

      const result = await service.exportExcel({ ids: ['case-1', 'case-2'] });
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(mockExcelService.buildWorkbook).toHaveBeenCalled();
    });

    it('should throw when no cases found', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([]);
      await expect(service.exportExcel({ ids: ['invalid'] }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('should toggle archive to true', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue(
        mockCases.map(({ clientId, currentStatus, ...rest }) => rest),
      );
      mockPrisma.visaCase.update.mockResolvedValue({} as any);

      const result = await service.archive({ ids: ['case-1', 'case-2'] }, 'user-1');
      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(mockPrisma.visaCase.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { archived: true } }),
      );
      expect(mockGateway.broadcast).toHaveBeenCalledWith('bulk:archiveComplete', { count: 2 });
    });
  });

  describe('restore', () => {
    it('should toggle archive to false', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue(
        mockCases.map(({ clientId, currentStatus, ...rest }) => rest),
      );
      mockPrisma.visaCase.update.mockResolvedValue({} as any);

      const result = await service.restore({ ids: ['case-1', 'case-2'] }, 'user-1');
      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(mockPrisma.visaCase.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { archived: false } }),
      );
      expect(mockGateway.broadcast).toHaveBeenCalledWith('bulk:restoreComplete', { count: 2 });
    });
  });

  describe('delete', () => {
    it('should delete all cases and broadcast', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue(
        mockCases.map(({ clientId, currentStatus, ...rest }) => rest),
      );
      mockPrisma.visaCase.delete.mockResolvedValue({} as any);

      const result = await service.delete({ ids: ['case-1', 'case-2'] }, 'user-1');
      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(mockPrisma.visaCase.delete).toHaveBeenCalledTimes(2);
      expect(mockAuditLog.log).toHaveBeenCalledTimes(2);
      expect(mockGateway.broadcast).toHaveBeenCalledWith('bulk:deleteComplete', { count: 2 });
    });

    it('should throw when no cases found', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue([]);
      await expect(service.delete({ ids: ['invalid'] }, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should continue on individual delete errors', async () => {
      mockPrisma.visaCase.findMany.mockResolvedValue(
        mockCases.map(({ clientId, currentStatus, ...rest }) => rest),
      );
      mockPrisma.visaCase.delete
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('FK constraint'));

      const result = await service.delete({ ids: ['case-1', 'case-2'] }, 'user-1');
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });
  });
});
