import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { categoryCreateSchema } from "@/lib/schemas";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { archived: false },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    select: { id: true, nameEn: true, nameHe: true, isDefault: true, sortOrder: true },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const parsed = categoryCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { nameEn, nameHe } = parsed.data;
  try {
    const created = await prisma.category.create({
      data: { nameEn: nameEn ?? null, nameHe: nameHe ?? null, sortOrder: 999 },
      select: { id: true, nameEn: true, nameHe: true, isDefault: true, sortOrder: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    // Unique violation on nameEn/nameHe.
    return NextResponse.json({ error: "A category with that name already exists." }, { status: 409 });
  }
}
