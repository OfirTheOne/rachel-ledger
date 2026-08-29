import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { installmentCreateSchema } from "@/lib/schemas";
import { splitInstallments, installmentDates } from "@/lib/scheduled";

// List plans with progress (how many installments are billed as of today).
export async function GET() {
  const today = new Date();
  const plans = await prisma.installmentPlan.findMany({
    include: {
      category: { select: { id: true, nameEn: true, nameHe: true } },
      expenses: { select: { date: true, amountAgorot: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const shaped = plans.map((p) => {
    const paidRows = p.expenses.filter((e) => e.date <= today);
    return {
      id: p.id,
      shop: p.shop,
      totalAmountAgorot: p.totalAmountAgorot,
      count: p.count,
      category: p.category,
      paidCount: paidRows.length,
      paidAgorot: paidRows.reduce((s, e) => s + e.amountAgorot, 0),
    };
  });
  return NextResponse.json(shaped);
}

export async function POST(req: NextRequest) {
  const parsed = installmentCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { totalAgorot, count, startDate, categoryId, shop, note, paymentMethod } = parsed.data;

  const amounts = splitInstallments(totalAgorot, count);
  const dates = installmentDates(startDate, count);

  const plan = await prisma.$transaction(async (tx) => {
    const created = await tx.installmentPlan.create({
      data: {
        totalAmountAgorot: totalAgorot,
        count,
        categoryId,
        shop,
        note: note ?? null,
        paymentMethod,
        startDate: new Date(startDate),
      },
    });
    await tx.expense.createMany({
      data: amounts.map((amountAgorot, i) => ({
        amountAgorot,
        date: new Date(dates[i]),
        categoryId,
        shop,
        note: note ?? null,
        paymentMethod,
        installmentPlanId: created.id,
        installmentSeq: i + 1,
        installmentCount: count,
      })),
    });
    return created;
  });

  return NextResponse.json(plan, { status: 201 });
}
