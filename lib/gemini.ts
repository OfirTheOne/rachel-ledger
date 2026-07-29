import { GoogleGenerativeAI } from "@google/generative-ai";

export function getModel(
  // "gemini-flash-latest" always tracks the current stable Flash model, so it
  // won't retire out from under us (verified working 2026-07-29). Pin a
  // specific id like "gemini-2.0-flash" or "gemini-3.5-flash" if you want
  // deterministic behavior across releases.
  model = "gemini-flash-latest"
) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(key).getGenerativeModel({ model });
}
