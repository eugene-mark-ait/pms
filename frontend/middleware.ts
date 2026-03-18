import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("mahaliwise_session")?.value;
  const path = request.nextUrl.pathname;
  const isLanding = path === "/";
  const isPricing = path === "/pricing";
  const isLogin = path === "/login" || path.startsWith("/login/");
  const isRegister = path === "/register" || path.startsWith("/register/");
  const isPublic = isLanding || isPricing || isLogin || isRegister;

  if (isPublic) {
    if (session && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api-backend).*)",
  ],
};
