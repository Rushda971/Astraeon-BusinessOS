import { PrismaClient } from "@prisma/client";

// Reuse one client during hot reloads and one fresh client in production.
const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
