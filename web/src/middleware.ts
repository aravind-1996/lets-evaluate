import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/register", "/api/auth", "/api/register"];

const protectedPrefixes = [
  "/people",
  "/evaluate",
  "/setup",
  "/archive",
  "/assignments",
  "/pipeline",
  "/openings",
  "/candidates",
  "/interviewers",
  "/booking",
  "/api/",
];

function isPublicPath(pathname: string) {
  return publicPaths.some(
    (p) =>
      pathname === p ||
      pathname.startsWith(p + "/") ||
      pathname.startsWith("/api/auth"),
  );
}

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((p) => pathname.startsWith(p));
}

function withSecurityHeaders(response: NextResponse, noStore = false) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (noStore) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    response.headers.set("Pragma", "no-cache");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await auth();

  if (
    session?.user?.id &&
    (pathname === "/login" || pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/people", request.url));
  }

  if (isPublicPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const isApp = isProtectedPath(pathname);

  if (isApp && !session?.user?.id) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return withSecurityHeaders(NextResponse.next(), isApp && !!session?.user?.id);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
