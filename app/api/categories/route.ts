import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { categoryCreateSchema } from "@/lib/schemas";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { archived: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const parsed = categoryCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const created = await prisma.category.create({ data: { name: parsed.data.name, sortOrder: 999 } });
  return NextResponse.json(created, { status: 201 });
}
