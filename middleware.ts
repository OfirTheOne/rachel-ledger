import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authToken, safeEqual } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;

  // Gate disabled when no password is configured (keeps local dev / previews
  // open). Production sets APP_PASSWORD to enable it.
  if (!password) return NextResponse.next();

  const expected = await authToken(password);
  const cookie = req.cookies.get(AUTH_COOKIE)?.value ?? "";
  if (safeEqual(cookie, expected)) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Guard everything except static assets, the app icon, and the auth routes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|app_icon.png|icon.jpg|apple-icon.jpg|login|api/login|api/logout).*)",
  ],
};
