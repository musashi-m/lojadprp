import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PANEL_PATH } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  if (!clientId) {
    return NextResponse.redirect(
      new URL(
        `${ADMIN_PANEL_PATH}?error=` +
          encodeURIComponent(
            "GOOGLE_CLIENT_ID não configurado. Adicione suas credenciais no arquivo .env.local para usar o login real do Google."
          ),
        storeUrl
      )
    );
  }

  const redirectUri = `${storeUrl}/api/admin/auth/google/callback`;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("access_type", "online");

  return NextResponse.redirect(googleAuthUrl.toString());
}

