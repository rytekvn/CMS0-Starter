// Chi kiem tra cookie CO TON TAI hay khong -> redirect nhanh, khong cham DB/API.
// Verify that lam o (app)/layout.tsx (goi /auth/me) va o JwtAuthGuard cua NestJS.
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest): NextResponse {
  const hasToken = Boolean(request.cookies.get("token"));
  const { pathname } = request.nextUrl;

  if (!hasToken && pathname !== "/login")
    return NextResponse.redirect(new URL("/login", request.url));

  if (hasToken && pathname === "/login")
    return NextResponse.redirect(new URL("/products", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/products/:path*"],
};
