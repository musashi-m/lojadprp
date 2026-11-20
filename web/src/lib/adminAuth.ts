import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "dprp_admin_session";
export const ADMIN_PANEL_PATH = process.env.ADMIN_PANEL_PATH || "/gestao-privada";
const SECRET = process.env.ADMIN_SECRET || "dprp_admin_secret_key_change_in_prod";

export interface AdminSession {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  role: string;
}

export function createAdminToken(user: AdminSession): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name || null,
    picture: user.picture || null,
    role: user.role || "OWNER",
    ts: Date.now(),
  });
  const b64Payload = Buffer.from(payload, "utf-8").toString("base64url");
  const hmac = crypto.createHmac("sha256", SECRET).update(b64Payload).digest("hex");
  return `${b64Payload}.${hmac}`;
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const [b64Payload, hmac] = token.split(".");
    if (!b64Payload || !hmac) return null;

    const expectedHmac = crypto.createHmac("sha256", SECRET).update(b64Payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return null;
    }

    const jsonStr = Buffer.from(b64Payload, "base64url").toString("utf-8");
    const data = JSON.parse(jsonStr);

    if (!data.email || !data.ts) return null;

    // Token valid for 7 days
    if (Date.now() - data.ts > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      role: data.role || "OWNER",
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(req?: NextRequest | Request): Promise<AdminSession | null> {
  // 1. Check Authorization Bearer header
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const session = verifyAdminToken(token);
      if (session) return session;
    }
  }

  // 2. Check Cookie
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (sessionCookie?.value) {
      const session = verifyAdminToken(sessionCookie.value);
      if (session) return session;
    }
  } catch {
    // fallback
  }

  return null;
}

export async function isAdminAuthenticated(req?: NextRequest | Request): Promise<boolean> {
  const session = await getAdminSession(req);
  return session !== null;
}
