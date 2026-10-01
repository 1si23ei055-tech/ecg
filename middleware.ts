import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login", "/api/login", "/api/seed"];

function isPublicPath(pathname: string, method: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return true;
  }
  if (pathname === "/api/ecg" && method === "POST") {
    return true;
  }
  if (pathname === "/api/events" && method === "POST") {
    return true;
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return true;
  }
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname, request.method)) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
