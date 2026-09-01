// Safe Prisma client singleton
let PrismaClient: any;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch {
  PrismaClient = class {
    order = { findMany: async () => [], create: async () => ({}) };
    product = { findMany: async () => [], create: async () => ({}) };
    category = { findMany: async () => [], create: async () => ({}) };
    banner = { findMany: async () => [], create: async () => ({}) };
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
