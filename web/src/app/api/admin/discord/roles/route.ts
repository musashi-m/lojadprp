import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const isAuth = await isAdminAuthenticated(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1520066176515047444";

  if (!token) {
    return NextResponse.json({ success: false, error: "DISCORD_BOT_TOKEN não configurado" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Falha ao buscar cargos no Discord" }, { status: res.status });
    }

    const roles: any[] = await res.json();
    // Filter out @everyone and managed bot roles, sort by position descending
    const filtered = roles
      .filter((r) => r.name !== "@everyone" && !r.managed && !r.name.includes("-----------------"))
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#99aab5",
        position: r.position,
      }))
      .sort((a, b) => b.position - a.position);

    return NextResponse.json({ success: true, roles: filtered });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

