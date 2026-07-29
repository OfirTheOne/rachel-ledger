import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { shop, note, amount, categories } = await req.json();
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: "categories required" }, { status: 400 });
    }
    const model = getModel();
    const prompt =
      `Pick the single best category for this expense from the list. ` +
      `Reply ONLY as JSON {"suggestedCategory": string, "confidence": number 0-1}.\n` +
      `Categories: ${categories.join(", ")}\n` +
      `Shop: ${shop ?? ""}\nNote: ${note ?? ""}\nAmount(ILS): ${amount ?? ""}`;
    const res = await model.generateContent(prompt);
    const text = res.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { suggestedCategory: string; confidence: number };
    if (!categories.includes(parsed.suggestedCategory)) {
      return NextResponse.json({ suggestedCategory: categories[categories.length - 1], confidence: 0 });
    }
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "categorize failed" }, { status: 502 });
  }
}
