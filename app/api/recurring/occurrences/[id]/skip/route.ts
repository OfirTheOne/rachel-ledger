import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.recurringOccurrence.update({ where: { id }, data: { status: "Skipped" } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  }
}
