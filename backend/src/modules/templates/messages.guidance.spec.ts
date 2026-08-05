import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';
import { TemplatesService } from './templates.service';

/**
 * A failed send should tell the agent what to do next, not surface a raw
 * technical string, so these assert the wording reaching the toast.
 */
describe('MessagesService — guidance when a send cannot happen', () => {
  const rendered = (over: Record<string, unknown> = {}) => ({
    subject: 'Sujet',
    body: 'Corps',
    client: { email: null, phoneNumber: null, whatsappNumber: null, ...over },
  });

  async function build(config: Record<string, string | undefined>) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: TemplatesService,
          useValue: { render: jest.fn().mockResolvedValue(rendered()) },
        },
        { provide: ConfigService, useValue: { get: (k: string) => config[k] } },
      ],
    }).compile();
    return module.get<MessagesService>(MessagesService);
  }

  const smtpReady = {
    SMTP_HOST: 'smtp.test',
    SMTP_USER: 'u',
    SMTP_PASS: 'p',
  };

  it('points the agent at the client file when there is no email', async () => {
    const service = await build(smtpReady);

    await expect(
      service.sendEmail({ visaCaseId: 'v1' } as never),
    ).rejects.toMatchObject({
      message: expect.stringContaining("pas d'adresse email"),
    });
    await expect(service.sendEmail({ visaCaseId: 'v1' } as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('says email is not configured rather than failing silently', async () => {
    const service = await build({});

    await expect(
      service.sendEmail({ visaCaseId: 'v1' } as never),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(
      service.sendEmail({ visaCaseId: 'v1' } as never),
    ).rejects.toMatchObject({
      message: expect.stringContaining("n'est pas configuré"),
    });
  });

  it('points the agent at the client file when there is no phone', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: TemplatesService,
          useValue: { render: jest.fn().mockResolvedValue(rendered()) },
        },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();
    const service = module.get<MessagesService>(MessagesService);

    await expect(
      service.buildWhatsappLink({ visaCaseId: 'v1' } as never),
    ).rejects.toMatchObject({
      message: expect.stringContaining('pas de numéro de téléphone'),
    });
  });
});
