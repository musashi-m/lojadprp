import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Security Headers (Anti-Clickjacking, Anti-Sniffing, Strict Referrer, XSS)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // 2. IP Rate Limiting for Admin Authentication routes (Anti-Brute Force)
  if (pathname.startsWith("/api/admin/auth/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const { allowed } = checkRateLimit(ip, 20, 60 * 1000);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Muitas tentativas de autenticação. Por segurança, aguarde 1 minuto." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 3. CSRF & Origin Verification on mutating API endpoints
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    (pathname.startsWith("/api/admin/") ||
      pathname.startsWith("/api/products") ||
      pathname.startsWith("/api/categories"))
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(
            JSON.stringify({ success: false, error: "Bloqueio de segurança CSRF: origem não autorizada." }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ success: false, error: "Origem inválida." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
