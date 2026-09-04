import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.POSTGRES_URL_NON_POOLING?.split("?")[0];
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: { name: '애설향' },
    orderBy: { createdAt: 'asc' },
  });
  console.log(users.map(u => ({ id: u.id, name: u.name, createdAt: u.createdAt, provider: u.provider })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
