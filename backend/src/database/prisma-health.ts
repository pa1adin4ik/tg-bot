import { prisma } from './prisma';

export const checkPrismaHealth = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
};
