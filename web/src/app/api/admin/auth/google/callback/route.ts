import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";
import { createAdminToken, ADMIN_COOKIE_NAME, ADMIN_PANEL_PATH } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const redirectUri = `${storeUrl}/api/admin/auth/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(
      new URL(
        `${ADMIN_PANEL_PATH}?error=${encodeURIComponent(error || "Autorização cancelada no Google")}`,
        storeUrl
      )
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(
        `${ADMIN_PANEL_PATH}?error=` +
          encodeURIComponent("Credenciais GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configuradas no .env.local"),
        storeUrl
      )
    );
  }

  try {
    // 1. Troca o código pelo access_token com a API do Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(
        new URL(
          `${ADMIN_PANEL_PATH}?error=${encodeURIComponent("Falha ao validar código de autenticação com o Google")}`,
          storeUrl
        )
      );
    }

    // 2. Busca os dados de perfil da conta Google logada
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    if (!profile || !profile.email) {
      return NextResponse.redirect(
        new URL(
          `${ADMIN_PANEL_PATH}?error=${encodeURIComponent("Não foi possível obter dados da conta Google")}`,
          storeUrl
        )
      );
    }

    // 3. Registra como primeiro proprietário (se for 1º login) ou valida proprietário existente
    const loginResult = dbRepository.handleGoogleAdminLogin({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name || profile.given_name,
      picture: profile.picture,
    });

    if (!loginResult.success || !loginResult.user) {
      return NextResponse.redirect(
        new URL(
          `${ADMIN_PANEL_PATH}?error=${encodeURIComponent(loginResult.error || "Acesso negado: você não é o proprietário cadastrado")}`,
          storeUrl
        )
      );
    }

    dbRepository.logAdminAction(
      loginResult.user.email,
      loginResult.isNewOwner ? "PRIMEIRO_REGISTRO_DONO" : "LOGIN_GOOGLE",
      loginResult.isNewOwner
        ? "Conta Google registrada como Proprietária definitiva do site"
        : "Login com sucesso via Google Accounts"
    );

    // 4. Emite sessão segura e redireciona para o painel
    const sessionToken = createAdminToken({
      id: loginResult.user.id,
      email: loginResult.user.email,
      name: loginResult.user.name,
      picture: loginResult.user.picture,
      role: loginResult.user.role,
    });

    const response = NextResponse.redirect(new URL(ADMIN_PANEL_PATH, storeUrl));
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `${ADMIN_PANEL_PATH}?error=${encodeURIComponent(err.message || "Erro durante comunicação com o Google")}`,
        storeUrl
      )
    );
  }
}

