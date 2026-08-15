import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { recurringUpdateSchema } from "@/lib/schemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = recurringUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const updated = await prisma.recurringPayment.update({ where: { id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Recurring payment not found" }, { status: 404 });
  }
}

// Deleting a template removes its (pending) occurrences via cascade; already
// confirmed expenses are kept (their recurringPaymentId is set null).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.recurringPayment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Recurring payment not found" }, { status: 404 });
  }
}
