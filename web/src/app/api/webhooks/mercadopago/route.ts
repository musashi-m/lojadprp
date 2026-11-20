import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";
import { sendDiscordPurchaseNotification } from "@/lib/discordNotifier";
import {
  fetchMercadoPagoPaymentStatus,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Data ID can come from query string or body
    const dataId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      body.data?.id ||
      body.id;

    const action = body.action || url.searchParams.get("topic") || body.type;

    console.log(`[MercadoPago Webhook] Received event: ${action}, Payment ID: ${dataId}`);

    if (!dataId) {
      // Just an informational webhook ping
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Verify Signature
    const signatureHeader = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");
    const isSignatureValid = verifyMercadoPagoWebhookSignature(
      signatureHeader,
      requestId,
      String(dataId)
    );

    if (!isSignatureValid) {
      console.warn("[MercadoPago Webhook] Invalid webhook signature. Rejecting.");
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    // Query real status from Mercado Pago API
    const payment = await fetchMercadoPagoPaymentStatus(String(dataId));

    if (payment.status === "approved") {
      let order = null;

      // 1. Try finding by external reference (our order ID)
      if (payment.externalReference) {
        order = dbRepository.getOrderById(payment.externalReference);
      }

      // 2. Fallback: find by Mercado Pago payment ID
      if (!order) {
        order = dbRepository.getOrderByMpPaymentId(String(dataId));
      }

      if (order) {
        const marked = dbRepository.markOrderAsPaid(order.id, String(dataId));
        console.log(`[MercadoPago Webhook] Order ${order.id} marked as PAID. (new: ${marked})`);
        if (marked) {
          const paidOrder = dbRepository.getOrderById(order.id);
          if (paidOrder) {
            sendDiscordPurchaseNotification(paidOrder).catch((err) =>
              console.error("[MercadoPago Webhook] Discord notification error:", err)
            );
          }
        }
      } else {
        console.warn(`[MercadoPago Webhook] No matching order found for payment ${dataId}`);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[MercadoPago Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do webhook" },
      { status: 500 }
    );
  }
}

