import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { categoryUpdateSchema } from "@/lib/schemas";

const FALLBACK_NAME = "Other";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = categoryUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const updated = await prisma.category.update({ where: { id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
}

// Delete a category by reassigning its expenses to the "Other" fallback, then
// removing it. Refuses to delete the fallback itself. Returns how many
// expenses were moved so the UI can inform the user.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  if (category.name === FALLBACK_NAME) {
    return NextResponse.json(
      { error: `"${FALLBACK_NAME}" is the fallback category and cannot be deleted.` },
      { status: 400 },
    );
  }

  // Ensure a fallback target exists (recreate it if it was renamed/removed).
  let fallback = await prisma.category.findFirst({ where: { name: FALLBACK_NAME } });
  if (!fallback) {
    fallback = await prisma.category.create({ data: { name: FALLBACK_NAME, sortOrder: 999 } });
  }

  const [{ count }] = await prisma.$transaction([
    prisma.expense.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } }),
    prisma.category.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true, movedCount: count, movedTo: fallback.name });
}
