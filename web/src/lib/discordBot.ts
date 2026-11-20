import fs from "node:fs";
import path from "node:path";
import { DbOrder, dbRepository } from "@/lib/db";
import { STORE_CONFIG } from "@/data/mockProducts";

const DISCORD_API = "https://discord.com/api/v10";

function formatBrazilDate(dateStr?: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  try {
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return formatted.replace(",", " às");
  } catch {
    return d.toLocaleString("pt-BR").replace(",", " às");
  }
}

function getBotToken(): string | undefined {
  return process.env.DISCORD_BOT_TOKEN?.trim() || dbRepository.getSetting("discord_bot_token") || undefined;
}

function getGuildId(): string {
  return process.env.DISCORD_GUILD_ID?.trim() || dbRepository.getSetting("discord_guild_id") || "1520066176515047444";
}

function getApoiadorRoleId(): string {
  return (
    process.env.DISCORD_APOIADOR_ROLE_ID?.trim() ||
    dbRepository.getSetting("discord_apoiador_role_id") ||
    "1520077253281579118" // Role '・Doador' / Apoiador
  );
}

export interface DiscordActionItem {
  timing: "Após a confirmação" | "Quando expirar" | string;
  action: "Adicionar cargo" | "Remover cargo" | "Aplicar banimento" | "Revogar banimento" | string;
  roleId: string;
}

/**
 * Adiciona um cargo a um membro no servidor do Discord
 */
export async function addMemberRole(userId: string, roleId: string): Promise<boolean> {
  const token = getBotToken();
  const guildId = getGuildId();
  if (!token || !userId || !roleId) return false;

  try {
    const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId.trim()}`, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (res.ok || res.status === 204) {
      console.log(`[Discord Bot] Cargo ${roleId} adicionado com sucesso para o usuário ${userId}`);
      return true;
    }
    const errText = await res.text().catch(() => "");
    console.warn(`[Discord Bot] Falha ao adicionar cargo ${roleId} para ${userId}: Status ${res.status} - ${errText}`);
    return false;
  } catch (err) {
    console.error(`[Discord Bot] Erro ao adicionar cargo ${roleId}:`, err);
    return false;
  }
}

/**
 * Remove um cargo de um membro no servidor do Discord
 */
export async function removeMemberRole(userId: string, roleId: string): Promise<boolean> {
  const token = getBotToken();
  const guildId = getGuildId();
  if (!token || !userId || !roleId) return false;

  try {
    const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId.trim()}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (res.ok || res.status === 204) {
      console.log(`[Discord Bot] Cargo ${roleId} removido com sucesso do usuário ${userId}`);
      return true;
    }
    const errText = await res.text().catch(() => "");
    console.warn(`[Discord Bot] Falha ao remover cargo ${roleId} de ${userId}: Status ${res.status} - ${errText}`);
    return false;
  } catch (err) {
    console.error(`[Discord Bot] Erro ao remover cargo ${roleId}:`, err);
    return false;
  }
}

/**
 * Envia uma mensagem direta (DM) privada para o cliente informando sobre a aprovação da compra.
 * Formato 100% idêntico ao webhook oficial da CentralCart, com título "COMPRA APROVADA!" e banner anexo.
 */
export async function sendPurchaseDirectMessage(userId: string, order: DbOrder, grantedRoles: string[] = []): Promise<boolean> {
  const token = getBotToken();
  if (!token || !userId) return false;

  try {
    // 1. Abre ou recupera o canal de DM com o usuário
    const channelRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: userId }),
    });

    if (!channelRes.ok) {
      console.warn(`[Discord Bot] Não foi possível abrir DM com o usuário ${userId} (DM fechada): ${channelRes.status}`);
      return false;
    }

    const channelData = await channelRes.json();
    const channelId = channelData.id;
    if (!channelId) return false;

    // 2. Monta os dados exatamente no formato do Webhook
    const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "https://loja.distritopaulistarp.com.br";
    const totalFormatted = order.total_amount.toFixed(2).replace(".", ",");
    const dateFormatted = formatBrazilDate(order.paid_at || order.created_at);

    const itemsList =
      order.items && order.items.length > 0
        ? order.items.map((i) => `${i.quantity}x ${i.product_name}`).join("\n")
        : "1x Pacote da Loja";

    const paymentMethodLabel = order.payment_method === "mercadopago" ? "Mercado Pago" : "Pix";

    // Busca o banner nos caminhos possíveis
    const possiblePaths = [
      path.resolve(process.cwd(), "public/compra-concluida.png"),
      path.resolve(process.cwd(), "web/public/compra-concluida.png"),
      "c:/Users/Vinicius/Downloads/loja/web/public/compra-concluida.png",
      "c:/Users/Vinicius/Downloads/loja/public/compra-concluida.png",
    ];
    const bannerPath = possiblePaths.find((p) => fs.existsSync(p));
    const hasBannerFile = Boolean(bannerPath && fs.existsSync(bannerPath));

    const embedPayload: any = {
      author: {
        name: STORE_CONFIG.serverName,
        icon_url: STORE_CONFIG.logoUrl,
      },
      title: "COMPRA APROVADA!",
      color: 53866, // #00D26A (Verde esmeralda CentralCart)
      fields: [
        {
          name: "Pacote(s):",
          value: `\`\`\`\n${itemsList}\n\`\`\``,
          inline: false,
        },
        {
          name: "Cupom:",
          value: `\`\`\`\n${order.coupon_code || "NENHUM"}\n\`\`\``,
          inline: true,
        },
        {
          name: "Método de pagamento:",
          value: `\`\`\`\n${paymentMethodLabel}\n\`\`\``,
          inline: true,
        },
        {
          name: "Valor:",
          value: `\`\`\`\nR$ ${totalFormatted}\n\`\`\``,
          inline: true,
        },
        {
          name: "Data de pagamento:",
          value: `\`\`\`\n${dateFormatted}\n\`\`\``,
          inline: false,
        },
        {
          name: "Contato (Discord):",
          value: `<@${userId}>`,
          inline: true,
        },
        {
          name: "Passaporte:",
          value: `#${order.character_id}`,
          inline: true,
        },
      ],
      image: {
        url: hasBannerFile ? "attachment://compra-concluida.png" : `${storeUrl}/compra-concluida.png`,
      },
      footer: {
        text: "distritopaulista.centralcart.ai",
        icon_url: STORE_CONFIG.logoUrl,
      },
      timestamp: new Date().toISOString(),
    };

    const payloadJson = {
      embeds: [embedPayload],
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 5, // Link
              label: "Acessar Loja Oficial",
              url: storeUrl,
            },
          ],
        },
      ],
    };

    let msgRes: Response;

    if (hasBannerFile && bannerPath) {
      const formData = new FormData();
      formData.append("payload_json", JSON.stringify(payloadJson));
      const fileBuffer = fs.readFileSync(bannerPath);
      const blob = new Blob([fileBuffer], { type: "image/png" });
      formData.append("files[0]", blob, "compra-concluida.png");

      msgRes = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
        },
        body: formData,
      });
    } else {
      msgRes = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadJson),
      });
    }

    if (msgRes.ok) {
      console.log(`[Discord Bot] DM de confirmação com banner enviada com sucesso para ${userId}`);
      return true;
    }

    const errBody = await msgRes.text().catch(() => "");
    console.warn(`[Discord Bot] Falha ao enviar DM para ${userId}: ${msgRes.status} - ${errBody}`);
    return false;
  } catch (err) {
    console.error("[Discord Bot] Erro ao enviar DM para o usuário:", err);
    return false;
  }
}

/**
 * Executa todas as ações de Discord configuradas quando um pedido é pago
 */
export async function processDiscordActionsForOrder(order: DbOrder): Promise<void> {
  const userId = order.discord_id;
  if (!userId) {
    console.log(`[Discord Bot] Pedido ${order.id} não possui discord_id vinculado. Pulando ações de Discord.`);
    return;
  }

  const grantedRoles: string[] = [];

  // 1. Sempre concede o cargo padrão de Apoiador (Doador) para qualquer compra realizada na loja
  const apoiadorRole = getApoiadorRoleId();
  if (apoiadorRole) {
    const success = await addMemberRole(userId, apoiadorRole);
    if (success) grantedRoles.push(apoiadorRole);
  }

  // 2. Processa ações específicas de cada produto comprado
  const db = dbRepository.getDbSync();
  const items = order.items || db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as any[];

  for (const item of items) {
    const prodRow = db.prepare("SELECT discord_actions FROM products WHERE id = ?").get(item.product_id) as any;
    let actions: DiscordActionItem[] = [];
    try {
      if (prodRow?.discord_actions) {
        actions = JSON.parse(prodRow.discord_actions);
      }
    } catch {}

    for (const act of actions) {
      if (act.timing === "Após a confirmação" && act.roleId) {
        if (act.action === "Adicionar cargo") {
          const ok = await addMemberRole(userId, act.roleId);
          if (ok && !grantedRoles.includes(act.roleId)) {
            grantedRoles.push(act.roleId);
          }
        } else if (act.action === "Remover cargo") {
          await removeMemberRole(userId, act.roleId);
        }
      }
    }
  }

  // 3. Envia a Notificação via DM com o resumo da compra e os cargos concedidos
  await sendPurchaseDirectMessage(userId, order, grantedRoles).catch((err) =>
    console.warn("[Discord Bot] Falha ao enviar DM:", err)
  );
}

/**
 * Processa a remoção de cargos no Discord quando um produto/VIP expira
 */
export async function processDiscordActionsOnExpiration(userId: string, discordActionsJson?: string): Promise<void> {
  if (!userId || !discordActionsJson) return;

  try {
    const actions: DiscordActionItem[] = JSON.parse(discordActionsJson);
    for (const act of actions) {
      if (act.timing === "Quando expirar" && act.roleId) {
        if (act.action === "Remover cargo") {
          await removeMemberRole(userId, act.roleId);
        } else if (act.action === "Adicionar cargo") {
          await addMemberRole(userId, act.roleId);
        }
      }
    }
  } catch (err) {
    console.error("[Discord Bot] Erro ao processar ações de expiração no Discord:", err);
  }
}

