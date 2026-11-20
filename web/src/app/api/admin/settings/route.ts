import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { dbRepository } from "@/lib/db";

export async function GET(req: NextRequest) {
  const isAuth = await isAdminAuthenticated(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const webhookUrl =
    dbRepository.getSetting("discord_webhook_url") ||
    process.env.DISCORD_WEBHOOK_URL?.trim() ||
    "";

  return NextResponse.json({
    success: true,
    discordWebhookUrl: webhookUrl,
  });
}

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const webhookUrl = typeof body.discordWebhookUrl === "string" ? body.discordWebhookUrl.trim() : "";

    dbRepository.setSetting("discord_webhook_url", webhookUrl);

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso!",
      discordWebhookUrl: webhookUrl,
    });
  } catch (err: any) {
    console.error("Settings POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
