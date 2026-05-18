import { PrismaClient } from '@prisma/client';

import { appConfig, logger } from '../config';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: appConfig.isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (!appConfig.isProduction) {
  globalForPrisma.prisma = prisma;
}

export const connectPrisma = async (): Promise<void> => {
  await prisma.$connect();
  logger.info('Prisma connected');
};

export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
};
