import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const returnTo = state ? decodeURIComponent(state) : "/checkout";

  const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const redirectUri = `${storeUrl}/api/auth/discord/callback`;

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`${returnTo}?discord_error=${encodeURIComponent(error || "cancelado")}`, storeUrl)
    );
  }

  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`${returnTo}?discord_error=missing_credentials`, storeUrl)
    );
  }

  try {
    // 1. Troca o código pelo token de acesso com a API do Discord
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Discord OAuth] Erro na troca de token:", tokenData);
      return NextResponse.redirect(
        new URL(`${returnTo}?discord_error=token_exchange_failed`, storeUrl)
      );
    }

    // 2. Busca o perfil do usuário logado no Discord
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.id) {
      console.error("[Discord OAuth] Erro ao buscar usuário:", userData);
      return NextResponse.redirect(
        new URL(`${returnTo}?discord_error=user_fetch_failed`, storeUrl)
      );
    }

    // 3. Monta o avatar
    let avatarUrl = "https://distritopaulista.centralcart.ai/cdn/stores/24490/theme/df72b599-f8f9-4dca-a283-df61d4e0d71a.png";
    if (userData.avatar) {
      const isGif = userData.avatar.startsWith("a_");
      avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${isGif ? "gif" : "png"}?size=128`;
    } else {
      const index = Number(BigInt(userData.id) % BigInt(5));
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    }

    const discordUser = {
      id: userData.id,
      username: userData.username,
      globalName: userData.global_name || userData.username,
      avatar: avatarUrl,
      email: userData.email || null,
    };

    const userJson = JSON.stringify(discordUser);
    const destinationUrl = new URL(returnTo, storeUrl);
    destinationUrl.searchParams.set("discord_connected", "true");

    // HTML intermediário que injeta diretamente no localStorage e redireciona
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vinculando Discord...</title>
</head>
<body style="background:#09090b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <p style="font-size:14px;color:#a1a1aa;">Vinculando sua conta do Discord...</p>
  </div>
  <script>
    try {
      localStorage.setItem("dprp_discord_user", ${JSON.stringify(userJson)});
    } catch (e) {}
    window.location.replace(${JSON.stringify(destinationUrl.toString())});
  </script>
</body>
</html>`;

    const response = new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });

    // Salva também no Cookie (Next.js já aplica a codificação padrão de cookie)
    response.cookies.set("dprp_discord_user", userJson, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (err) {
    console.error("[Discord OAuth] Exceção:", err);
    return NextResponse.redirect(
      new URL(`${returnTo}?discord_error=server_error`, storeUrl)
    );
  }
}
