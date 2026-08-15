import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { duePeriods } from "@/lib/scheduled";

// Materialize-on-open: ensure every active template has a Pending occurrence for
// each month from its start through the current month. Idempotent.
export async function POST() {
  const today = new Date().toISOString().slice(0, 10);
  const active = await prisma.recurringPayment.findMany({
    where: { active: true },
    include: { occurrences: { select: { periodMonth: true } } },
  });

  const toCreate: { recurringPaymentId: string; periodMonth: Date }[] = [];
  for (const rp of active) {
    const startISO = rp.startMonth.toISOString().slice(0, 10);
    const existing = rp.occurrences.map((o) => o.periodMonth.toISOString().slice(0, 10));
    for (const period of duePeriods(startISO, today, existing)) {
      toCreate.push({ recurringPaymentId: rp.id, periodMonth: new Date(period) });
    }
  }

  if (toCreate.length) {
    await prisma.recurringOccurrence.createMany({ data: toCreate, skipDuplicates: true });
  }
  return NextResponse.json({ created: toCreate.length });
}
