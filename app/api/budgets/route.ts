import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { budgetUpsertSchema } from "@/lib/schemas";

// List all budgets (the overall one has categoryId === null).
export async function GET() {
  const budgets = await prisma.budget.findMany({
    select: { id: true, categoryId: true, amountAgorot: true },
  });
  return NextResponse.json(budgets);
}

// Upsert a budget keyed by categoryId (null = overall). amountAgorot <= 0 deletes.
export async function PUT(req: NextRequest) {
  const parsed = budgetUpsertSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { categoryId, amountAgorot } = parsed.data;

  // Find the existing row for this key. The overall row (categoryId null) can't
  // be matched by a unique where, so look it up explicitly.
  const existing = categoryId
    ? await prisma.budget.findUnique({ where: { categoryId } })
    : await prisma.budget.findFirst({ where: { categoryId: null } });

  if (amountAgorot <= 0) {
    if (existing) await prisma.budget.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, removed: true });
  }

  const saved = existing
    ? await prisma.budget.update({ where: { id: existing.id }, data: { amountAgorot } })
    : await prisma.budget.create({ data: { categoryId, amountAgorot } });

  return NextResponse.json({ id: saved.id, categoryId: saved.categoryId, amountAgorot: saved.amountAgorot });
}
