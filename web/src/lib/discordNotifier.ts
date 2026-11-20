import fs from "node:fs";
import path from "node:path";
import { DbOrder, dbRepository } from "@/lib/db";
import { STORE_CONFIG } from "@/data/mockProducts";

/**
 * Format date in Brazilian timezone (e.g., "08/11/2026 às 18:16")
 */
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

/**
 * Sends a rich Discord embed notification when a purchase is completed.
 * Matches CentralCart's official embed format with 100% fidelity.
 */
export async function sendDiscordPurchaseNotification(
  order: DbOrder,
  customWebhookUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl =
    customWebhookUrl ||
    dbRepository.getSetting("discord_webhook_url") ||
    process.env.DISCORD_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    console.log("[Discord Notifier] No webhook URL configured. Skipping notification.");
    return { success: false, error: "Nenhum Webhook configurado" };
  }

  try {
    const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
    const totalFormatted = order.total_amount.toFixed(2).replace(".", ",");
    const dateFormatted = formatBrazilDate(order.paid_at || order.created_at);

    // Format list of packages
    const itemsList =
      order.items && order.items.length > 0
        ? order.items.map((i) => `${i.quantity}x ${i.product_name}`).join("\n")
        : "1x Pacote da Loja";

    // Discord contact format
    const contactDiscord = order.discord_id
      ? `<@${order.discord_id}>`
      : order.discord_username
      ? `@${order.discord_username}`
      : `@${order.customer_name}`;

    // Read banner image from public folder
    const possiblePaths = [
      path.resolve(process.cwd(), "public/compra-concluida.png"),
      path.resolve(process.cwd(), "web/public/compra-concluida.png"),
      "c:/Users/Vinicius/Downloads/loja/web/public/compra-concluida.png",
      "c:/Users/Vinicius/Downloads/loja/public/compra-concluida.png",
    ];
    const bannerPath = possiblePaths.find((p) => fs.existsSync(p));
    const hasBannerFile = Boolean(bannerPath && fs.existsSync(bannerPath));

    const embedPayload = {
      author: {
        name: STORE_CONFIG.serverName,
        icon_url: STORE_CONFIG.logoUrl,
      },
      title: `Novo pagamento de R$ ${totalFormatted}! 🎉`,
      color: 53866, // #00D26A (Bright emerald green matching CentralCart)
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
          value: "```\nMercado Pago\n```",
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
          value: contactDiscord,
          inline: true,
        },
        {
          name: "Passaporte:",
          value: `#${order.character_id}`,
          inline: true,
        },
      ],
      image: {
        url: hasBannerFile
          ? "attachment://compra-concluida.png"
          : `${storeUrl}/compra-concluida.png`,
      },
      footer: {
        text: "distritopaulista.centralcart.ai",
        icon_url: STORE_CONFIG.logoUrl,
      },
      timestamp: new Date().toISOString(),
    };

    const payloadJson = {
      username: `${STORE_CONFIG.serverName} • Vendas`,
      avatar_url: STORE_CONFIG.logoUrl,
      embeds: [embedPayload],
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 5, // Link
              label: "Ver pedido",
              url: `${storeUrl}/gestao-privada`,
            },
          ],
        },
      ],
    };

    let response: Response;

    if (hasBannerFile && bannerPath) {
      // Send as multipart/form-data with attached image
      const formData = new FormData();
      formData.append("payload_json", JSON.stringify(payloadJson));

      const fileBuffer = fs.readFileSync(bannerPath);
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: "image/png" });
      formData.append("files[0]", blob, "compra-concluida.png");

      response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
      });
    } else {
      // Send as pure JSON
      response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadJson),
      });
    }

    if (!response.ok) {
      // Fallback: in case Discord rejects components on certain webhook endpoints, retry without components
      const text = await response.text();
      console.warn("[Discord Notifier] Webhook returned error, retrying without components:", text);

      const fallbackPayload = {
        username: `${STORE_CONFIG.serverName} • Vendas`,
        avatar_url: STORE_CONFIG.logoUrl,
        embeds: [embedPayload],
      };

      if (hasBannerFile && bannerPath) {
        const formData = new FormData();
        formData.append("payload_json", JSON.stringify(fallbackPayload));
        const fileBuffer = fs.readFileSync(bannerPath);
        const blob = new Blob([new Uint8Array(fileBuffer)], { type: "image/png" });
        formData.append("files[0]", blob, "compra-concluida.png");

        const retryRes = await fetch(webhookUrl, {
          method: "POST",
          body: formData,
        });

        if (!retryRes.ok) {
          const retryErr = await retryRes.text();
          return { success: false, error: retryErr };
        }
      } else {
        const retryRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackPayload),
        });

        if (!retryRes.ok) {
          const retryErr = await retryRes.text();
          return { success: false, error: retryErr };
        }
      }
    }

    console.log(`[Discord Notifier] Notification sent successfully for order ${order.id}`);
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[Discord Notifier] Failed to send webhook:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Send a demo test notification to verify webhook configuration
 */
export async function sendDiscordTestNotification(
  webhookUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  const mockOrder: DbOrder = {
    id: `DPRP-${Date.now().toString().slice(-6)}-DEMO`,
    mp_payment_id: "190644864638",
    status: "PAID",
    character_id: "136",
    discord_id: "1535363857848209510",
    discord_username: "saulo aragao",
    customer_name: "Saulo Aragão",
    customer_email: "cliente@exemplo.com",
    customer_cpf: "000.000.000-00",
    total_amount: 79.8,
    discount_amount: 0,
    coupon_code: null,
    payment_method: "pix",
    qr_code: null,
    qr_code_base64: null,
    ticket_url: null,
    expires_at: null,
    paid_at: new Date().toISOString(),
    delivered_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: "item-1",
        order_id: "demo",
        product_id: "vip-turista",
        product_name: "VIP TURISTA (Mensal)",
        quantity: 1,
        unit_price: 49.9,
        product_slug: "vip-turista",
        category: "VIP",
        subtotal: 49.9,
      },
      {
        id: "item-2",
        order_id: "demo",
        product_id: "120-gemas",
        product_name: "120 GEMAS",
        quantity: 1,
        unit_price: 29.9,
        product_slug: "120-gemas",
        category: "GEMAS",
        subtotal: 29.9,
      },
    ],
  };

  return sendDiscordPurchaseNotification(mockOrder, webhookUrl);
}

/**
 * Sends a rich Discord embed notification when a package expires.
 */
export async function sendDiscordExpirationNotification(
  record: {
    orderId: string;
    characterId: string;
    discordId?: string | null;
    productName: string;
    expiredAt?: string | null;
  },
  customWebhookUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl =
    customWebhookUrl ||
    dbRepository.getSetting("discord_webhook_url") ||
    process.env.DISCORD_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return { success: false, error: "Nenhum Webhook configurado" };
  }

  try {
    const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
    const dateFormatted = formatBrazilDate(record.expiredAt || new Date().toISOString());
    const contactDiscord = record.discordId ? `<@${record.discordId}>` : "Não vinculado";

    const bannerPath = path.resolve(process.cwd(), "public/pacote-expirou.png");
    const hasBannerFile = fs.existsSync(bannerPath);

    const embedPayload = {
      author: {
        name: STORE_CONFIG.serverName,
        icon_url: STORE_CONFIG.logoUrl,
      },
      title: "⏰ Pacote Expirado no Servidor!",
      description: "O plano do jogador expirou e os comandos de remoção automática foram executados in-game.",
      color: 14752584, // #E11D48 (Vibrant red)
      fields: [
        {
          name: "Pacote:",
          value: `\`\`\`\n1x ${record.productName}\n\`\`\``,
          inline: false,
        },
        {
          name: "Passaporte:",
          value: `#${record.characterId}`,
          inline: true,
        },
        {
          name: "Contato (Discord):",
          value: contactDiscord,
          inline: true,
        },
        {
          name: "Data de Expiração:",
          value: `\`\`\`\n${dateFormatted}\n\`\`\``,
          inline: false,
        },
      ],
      image: {
        url: hasBannerFile
          ? "attachment://pacote-expirou.png"
          : `${storeUrl}/pacote-expirou.png`,
      },
      footer: {
        text: "distritopaulista.centralcart.ai",
        icon_url: STORE_CONFIG.logoUrl,
      },
      timestamp: new Date().toISOString(),
    };

    const payloadJson = {
      username: `${STORE_CONFIG.serverName} • Expirações`,
      avatar_url: STORE_CONFIG.logoUrl,
      embeds: [embedPayload],
    };

    if (hasBannerFile) {
      const formData = new FormData();
      formData.append("payload_json", JSON.stringify(payloadJson));
      const fileBuffer = fs.readFileSync(bannerPath);
      const blob = new Blob([fileBuffer], { type: "image/png" });
      formData.append("files[0]", blob, "pacote-expirou.png");

      await fetch(webhookUrl, { method: "POST", body: formData });
    } else {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadJson),
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Discord Notifier] Failed to send expiration webhook:", err);
    return { success: false, error: err.message };
  }
}
