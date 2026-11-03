import { NextResponse, type NextRequest } from "next/server";
import { isActiveToken, TOKEN_COOKIE } from "@/lib/tokens";

// Re-checks the token on every request so a deactivated token loses access immediately.
export async function middleware(req: NextRequest) {
  if (await isActiveToken(req.cookies.get(TOKEN_COOKIE)?.value)) return NextResponse.next();

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete(TOKEN_COOKIE);
  return res;
}

export const config = {
  // Everything except the verify page ("/" itself) and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).+)"],
};
