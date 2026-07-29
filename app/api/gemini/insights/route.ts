import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Named = { name?: string; shop?: string; total?: number };
type PeriodSummary = {
  total?: number;
  byCategory?: Named[];
  byShop?: Named[];
  byDayOfWeek?: { day: number; total: number }[];
};

// Amounts arrive as integer agorot (1 ₪ = 100 agorot) and days as 0=Sun..6=Sat.
// Normalize to human-readable shekels + day names so the model reasons over
// real values instead of misreading agorot as whole shekels.
const toShekels = (agorot?: number) => Number(((agorot ?? 0) / 100).toFixed(2));

function normalize(summary: PeriodSummary) {
  return {
    currency: "ILS (₪)",
    totalSpent: toShekels(summary.total),
    byCategory: (summary.byCategory ?? []).map((c) => ({ name: c.name, spent: toShekels(c.total) })),
    byShop: (summary.byShop ?? []).map((s) => ({ shop: s.shop, spent: toShekels(s.total) })),
    byDayOfWeek: (summary.byDayOfWeek ?? []).map((d) => ({
      day: DAY_NAMES[d.day] ?? String(d.day),
      spent: toShekels(d.total),
    })),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { periodSummary, locale } = await req.json();
    const model = getModel();
    const summary = normalize(periodSummary ?? {});
    const language = locale === "he" ? "Hebrew" : "English";
    const prompt =
      `You are a calm, encouraging personal finance assistant. All amounts are in ILS (₪) ` +
      `and are already in whole shekels (e.g. 1375.40 means ₪1,375.40). ` +
      `Refer to days by their names and format money with the ₪ symbol. ` +
      `Write every insight and suggestion in ${language}. ` +
      `Given this spending summary JSON, return ONLY JSON ` +
      `{"insights": string[] (3-5 short observations), "suggestions": string[] (2-4 gentle, actionable tips)}.\n` +
      `Summary: ${JSON.stringify(summary)}`;
    const res = await model.generateContent(prompt);
    const text = res.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { insights: string[]; suggestions: string[] };
    if (!Array.isArray(parsed.insights) || !Array.isArray(parsed.suggestions)) {
      return NextResponse.json({ error: "insights failed" }, { status: 502 });
    }
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "insights failed" }, { status: 502 });
  }
}
