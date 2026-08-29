import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Pending occurrences with their template info (for the "Due now" list).
export async function GET() {
  const items = await prisma.recurringOccurrence.findMany({
    where: { status: "Pending" },
    include: {
      recurringPayment: { include: { category: { select: { id: true, nameEn: true, nameHe: true } } } },
    },
    orderBy: { periodMonth: "asc" },
  });
  return NextResponse.json(items);
}
