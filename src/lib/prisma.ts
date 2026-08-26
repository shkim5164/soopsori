import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const rawUrl = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
  // 쿼리 스트링(?sslmode=require 등)이 있으면 pg 내부 설정과 충돌하므로 제거
  const connectionString = rawUrl.split("?")[0];
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase/Vercel 인증서 에러 완벽 해결
  });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
