import crypto from "node:crypto";
import { NextRequest } from "next/server";

export function authenticateFiveMRequest(req: NextRequest): boolean {
  const configuredSecret = process.env.FIVEM_API_SECRET || "dprp_fivem_secret_change_me_in_prod";
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return false;

  try {
    const tokenBuf = Buffer.from(token);
    const secretBuf = Buffer.from(configuredSecret);
    if (tokenBuf.length !== secretBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(tokenBuf, secretBuf);
  } catch {
    return false;
  }
}

