import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { expenseCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where = from && to ? { date: { gte: new Date(from), lt: new Date(to) } } : {};
  const expenses = await prisma.expense.findMany({
    where,
    include: { category: { select: { id: true, nameEn: true, nameHe: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { date, ...rest } = parsed.data;
  const created = await prisma.expense.create({ data: { ...rest, date: new Date(date) } });
  return NextResponse.json(created, { status: 201 });
}
