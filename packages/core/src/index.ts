export * from "./db/index.js";
export * from "./domain/types.js";

// Re-export Prisma types for convenience
export type { PrismaClient } from "@prisma/client";

console.log("✅ @crypto-tracker/core package loaded successfully");
