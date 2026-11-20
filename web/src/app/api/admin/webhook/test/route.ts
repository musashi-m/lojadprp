import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { sendDiscordTestNotification } from "@/lib/discordNotifier";

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const customUrl = body.webhookUrl?.trim() || undefined;

    const result = await sendDiscordTestNotification(customUrl);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Falha ao enviar notificação de teste" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notificação de teste enviada com sucesso no canal do Discord!",
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno ao disparar teste",
      },
      { status: 500 }
    );
  }
}

