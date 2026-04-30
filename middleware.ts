import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/login";
  const isApi = pathname.startsWith("/api");

  if (isApi) return NextResponse.next();

  // 🔥 NÃO BLOQUEIA MAIS "/" (resolve loop)
  if (!isLogin && pathname !== "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};