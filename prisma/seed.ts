import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const PRESETS = ["Groceries","Dining","Transport","Utilities","Shopping","Health","Entertainment","Other"];

async function main() {
  for (let i = 0; i < PRESETS.length; i++) {
    await prisma.category.upsert({
      where: { name: PRESETS[i] },
      update: {},
      create: { name: PRESETS[i], isDefault: true, sortOrder: i },
    });
  }
}
main().finally(() => prisma.$disconnect());
