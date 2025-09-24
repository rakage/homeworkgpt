// import { PrismaClient } from "./generated/prisma";
import { PrismaClient } from "@prisma/client";

// PrismaClient singleton for Next.js
// This prevents multiple instances in development with hot reloading

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
