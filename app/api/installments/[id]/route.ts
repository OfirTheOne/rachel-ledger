import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Deleting a plan cascades to its expense rows (schema onDelete: Cascade).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.installmentPlan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Installment plan not found" }, { status: 404 });
  }
}
