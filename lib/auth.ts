// Shared auth helpers. Uses Web Crypto (crypto.subtle), which is available in
// both the Edge middleware runtime and Node route handlers, so no dependency.

export const AUTH_COOKIE = "auth";

/** SHA-256 hex of a secret. The cookie stores this hash, never the password. */
export async function authToken(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-constant string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
