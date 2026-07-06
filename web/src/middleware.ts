import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/register", "/api/auth", "/api/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith("/api/auth"),
    )
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await auth();
  const isApp =
    pathname.startsWith("/people") ||
    pathname.startsWith("/evaluate") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/archive") ||
    pathname.startsWith("/assignments") ||
    pathname.startsWith("/pipeline") ||
    pathname.startsWith("/api/");

  if (isApp && !session?.user?.id) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
