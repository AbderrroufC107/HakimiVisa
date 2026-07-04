import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppGateway } from '../src/modules/gateway/app.gateway';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

export const JWT_SECRET = 'super-secret-change-in-production';

export function createInvalidToken(): string {
  return 'invalid-malformed-jwt-token-string';
}

export function createExpiredToken(): string {
  return jwt.sign(
    {
      sub: 'test-user',
      email: 'test@test.com',
      role: 'AGENT',
      iat: Math.floor(Date.now() / 1000) - 86400,
    },
    JWT_SECRET,
    { expiresIn: '-1h' },
  );
}

export function createValidToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    {
      sub: 'test-user',
      email: 'test@test.com',
      role: 'AGENT',
      ...overrides,
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

export async function getApp(mockPrisma?: DeepMockProxy<PrismaClient>): Promise<INestApplication> {
  if (!mockPrisma) {
    mockPrisma = mockDeep<PrismaClient>();
  }

  (mockPrisma as any).$transaction = jest.fn().mockImplementation(async (args: any) => {
    if (Array.isArray(args)) {
      return Promise.all(args.map((x: any) => (typeof x === 'function' ? x() : x)));
    }
    if (typeof args === 'function') {
      return args(mockPrisma);
    }
    return [];
  });

  (mockPrisma as any).$queryRaw = jest.fn().mockResolvedValue([{ 1: 1 }]);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma as unknown as PrismaService)
    .overrideProvider(AppGateway)
    .useValue({
      sendToUser: jest.fn(),
      broadcast: jest.fn(),
      handleConnection: jest.fn(),
      handleDisconnect: jest.fn(),
    })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}
