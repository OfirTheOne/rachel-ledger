import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { recurringCreateSchema } from "@/lib/schemas";

export async function GET() {
  const items = await prisma.recurringPayment.findMany({
    include: { category: { select: { id: true, nameEn: true, nameHe: true } } },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const parsed = recurringCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { name, categoryId, paymentMethod, amountAgorot, dayOfMonth, startMonth } = parsed.data;

  const created = await prisma.recurringPayment.create({
    data: {
      name,
      categoryId,
      paymentMethod,
      amountAgorot: amountAgorot ?? null,
      dayOfMonth: dayOfMonth ?? null,
      // normalize to the first of the chosen month
      startMonth: new Date(`${startMonth.slice(0, 7)}-01`),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
