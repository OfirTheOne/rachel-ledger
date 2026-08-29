import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { categoryUpdateSchema } from "@/lib/schemas";

const FALLBACK_NAME = "Other"; // matched against nameEn

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = categoryUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const { nameEn, nameHe, archived } = parsed.data;
  // Merge partial name updates over the current values, then guard the invariant
  // that a category always keeps at least one name.
  const nextEn = nameEn !== undefined ? nameEn : current.nameEn;
  const nextHe = nameHe !== undefined ? nameHe : current.nameHe;
  if (!nextEn && !nextHe) {
    return NextResponse.json({ error: "A category must keep at least one name." }, { status: 400 });
  }

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(nameEn !== undefined ? { nameEn } : {}),
        ...(nameHe !== undefined ? { nameHe } : {}),
        ...(archived !== undefined ? { archived } : {}),
      },
      select: { id: true, nameEn: true, nameHe: true, isDefault: true, sortOrder: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "A category with that name already exists." }, { status: 409 });
  }
}

// Delete a category by reassigning its expenses to the "Other" fallback, then
// removing it. Refuses to delete the fallback itself. Returns how many
// expenses were moved so the UI can inform the user.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  if (category.nameEn === FALLBACK_NAME) {
    return NextResponse.json(
      { error: `"${FALLBACK_NAME}" is the fallback category and cannot be deleted.` },
      { status: 400 },
    );
  }

  // Ensure a fallback target exists (recreate it if it was renamed/removed).
  let fallback = await prisma.category.findFirst({ where: { nameEn: FALLBACK_NAME } });
  if (!fallback) {
    fallback = await prisma.category.create({ data: { nameEn: FALLBACK_NAME, nameHe: "אחר", sortOrder: 999 } });
  }

  const [{ count }] = await prisma.$transaction([
    prisma.expense.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } }),
    prisma.category.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true, movedCount: count, movedTo: fallback.nameEn });
}
