import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";
import { createAdminToken, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Digite um e-mail válido (ex: seuemail@gmail.com)." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const googleId = `g_${Buffer.from(cleanEmail).toString("hex").substring(0, 20)}`;

    const loginResult = dbRepository.handleGoogleAdminLogin({
      googleId,
      email: cleanEmail,
      name: name || cleanEmail.split("@")[0],
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
    });

    if (!loginResult.success || !loginResult.user) {
      return NextResponse.json(
        { success: false, error: loginResult.error },
        { status: 403 }
      );
    }

    dbRepository.logAdminAction(
      loginResult.user.email,
      loginResult.isNewOwner ? "PRIMEIRO_REGISTRO_DONO" : "LOGIN_ACESSO",
      loginResult.isNewOwner
        ? "Conta Google registrada como Proprietária definitiva do site"
        : "Login com sucesso no painel"
    );

    const sessionToken = createAdminToken({
      id: loginResult.user.id,
      email: loginResult.user.email,
      name: loginResult.user.name,
      picture: loginResult.user.picture,
      role: loginResult.user.role,
    });

    const response = NextResponse.json({
      success: true,
      isNewOwner: loginResult.isNewOwner,
      user: loginResult.user,
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro no login" },
      { status: 500 }
    );
  }
}

