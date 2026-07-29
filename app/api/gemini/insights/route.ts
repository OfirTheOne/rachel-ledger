import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { periodSummary } = await req.json();
    const model = getModel();
    const prompt =
      `You are a calm, encouraging personal finance assistant. Currency is ILS (₪). ` +
      `Given this spending summary JSON, return ONLY JSON ` +
      `{"insights": string[] (3-5 short observations), "suggestions": string[] (2-4 gentle, actionable tips)}.\n` +
      `Summary: ${JSON.stringify(periodSummary)}`;
    const res = await model.generateContent(prompt);
    const text = res.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { insights: string[]; suggestions: string[] };
    if (!Array.isArray(parsed.insights) || !Array.isArray(parsed.suggestions)) {
      return NextResponse.json({ error: "insights failed" }, { status: 502 });
    }
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "insights failed" }, { status: 502 });
  }
}
