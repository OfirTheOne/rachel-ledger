import { GoogleGenerativeAI } from "@google/generative-ai";

export function getModel(
  // Configurable default model id — confirm/update this to a current Gemini
  // model when the user provisions their GEMINI_API_KEY.
  model = "gemini-1.5-flash"
) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(key).getGenerativeModel({ model });
}
