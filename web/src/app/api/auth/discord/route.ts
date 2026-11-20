import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/checkout";

  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  if (!clientId) {
    return NextResponse.redirect(
      new URL(`${returnTo}?discord_error=not_configured`, storeUrl)
    );
  }

  const redirectUri = `${storeUrl}/api/auth/discord/callback`;
  const state = returnTo;

  const discordAuthUrl = new URL("https://discord.com/oauth2/authorize");
  discordAuthUrl.searchParams.set("client_id", clientId);
  discordAuthUrl.searchParams.set("redirect_uri", redirectUri);
  discordAuthUrl.searchParams.set("response_type", "code");
  discordAuthUrl.searchParams.set("scope", "identify email");
  discordAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(discordAuthUrl.toString());
}

