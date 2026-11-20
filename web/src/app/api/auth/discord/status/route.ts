import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(
    process.env.DISCORD_CLIENT_ID?.trim() &&
    process.env.DISCORD_CLIENT_SECRET?.trim()
  );

  return NextResponse.json({
    configured,
    clientId: process.env.DISCORD_CLIENT_ID ? process.env.DISCORD_CLIENT_ID.substring(0, 4) + "..." : null,
  });
}

