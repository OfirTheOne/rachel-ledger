import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { aggregateKpis, periodRange, type ExpenseRow } from "@/lib/kpis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") === "month" ? "month" : "week";
  const anchor = searchParams.get("anchor") ?? new Date().toISOString().slice(0, 10);
  const { start, end } = periodRange(range, anchor);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: new Date(start), lt: new Date(end) } },
    include: { category: { select: { name: true } } },
  });
  const rows: ExpenseRow[] = expenses.map((e) => ({
    amountAgorot: e.amountAgorot,
    date: e.date.toISOString().slice(0, 10),
    categoryName: e.category.name,
    shop: e.shop,
  }));
  return NextResponse.json({ range, start, end, ...aggregateKpis(rows) });
}
