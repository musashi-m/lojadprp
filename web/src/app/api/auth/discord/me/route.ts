import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("dprp_discord_user");
  let raw = cookie?.value || null;
  let user = null;

  if (raw) {
    try {
      // Decode if encoded
      let decoded = raw;
      while (decoded.includes("%7B") || decoded.includes("%22")) {
        decoded = decodeURIComponent(decoded);
      }
      user = JSON.parse(decoded);
    } catch {
      try {
        user = JSON.parse(raw);
      } catch (err) {
        // failed
      }
    }
  }

  return NextResponse.json({
    cookiePresent: Boolean(cookie),
    rawCookieValue: raw,
    user,
  });
}

