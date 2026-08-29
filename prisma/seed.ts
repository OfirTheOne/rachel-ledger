import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// [English, Hebrew] preset categories.
const PRESETS: [string, string][] = [
  ["Groceries", "מכולת"],
  ["Dining", "מסעדות"],
  ["Transport", "תחבורה"],
  ["Utilities", "חשבונות"],
  ["Shopping", "קניות"],
  ["Health", "בריאות"],
  ["Entertainment", "בידור"],
  ["Other", "אחר"],
];

async function main() {
  // Backfill: copy any legacy `name` into `nameEn` so existing (incl. custom)
  // categories keep their label under the new bilingual model.
  const existing = await prisma.category.findMany();
  for (const c of existing) {
    if (!c.nameEn && c.name) {
      await prisma.category.update({ where: { id: c.id }, data: { nameEn: c.name } });
    }
  }

  // Presets: match by English name, add the Hebrew label (and create if missing).
  for (let i = 0; i < PRESETS.length; i++) {
    const [en, he] = PRESETS[i];
    await prisma.category.upsert({
      where: { nameEn: en },
      update: { nameHe: he },
      create: { nameEn: en, nameHe: he, isDefault: true, sortOrder: i },
    });
  }
}
main().finally(() => prisma.$disconnect());
