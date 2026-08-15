import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { occurrenceConfirmSchema } from "@/lib/schemas";

// Confirm a pending occurrence -> create a real expense (tagged recurring) and
// mark the occurrence Confirmed.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = occurrenceConfirmSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { amountAgorot, date } = parsed.data;

  const occ = await prisma.recurringOccurrence.findUnique({
    where: { id },
    include: { recurringPayment: true },
  });
  if (!occ) return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  if (occ.status === "Confirmed") return NextResponse.json({ error: "already confirmed" }, { status: 409 });

  const rp = occ.recurringPayment;
  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        amountAgorot,
        date: new Date(date),
        categoryId: rp.categoryId,
        shop: rp.name,
        paymentMethod: rp.paymentMethod,
        recurringPaymentId: rp.id,
      },
    });
    await tx.recurringOccurrence.update({
      where: { id },
      data: { status: "Confirmed", expenseId: created.id },
    });
    return created;
  });

  return NextResponse.json(expense, { status: 201 });
}
