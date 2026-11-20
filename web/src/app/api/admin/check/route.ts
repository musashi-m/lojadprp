import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { dbRepository } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  const owner = dbRepository.getOwnerUser();
  const hasGoogleConfig = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );

  return NextResponse.json({
    authenticated: session !== null,
    user: session,
    hasOwner: owner !== null,
    ownerEmail: owner ? owner.email : null,
    hasGoogleConfig,
  });
}
