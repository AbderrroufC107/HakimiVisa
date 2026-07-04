import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type MockPrisma = DeepMockProxy<PrismaClient>;

export function createMockPrisma(): MockPrisma {
  return mockDeep<PrismaClient>();
}

export function createMockPrismaService(): DeepMockProxy<PrismaService> {
  return mockDeep<PrismaService>();
}

export function resetMockPrisma(mock: MockPrisma) {
  mockReset(mock);
}

export const mockTransaction = Symbol('mock-transaction');
