import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";
import { fetchMercadoPagoPaymentStatus } from "@/lib/mercadopago";
import { sendDiscordPurchaseNotification } from "@/lib/discordNotifier";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let order = dbRepository.getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // If order is still pending and has a Mercado Pago payment ID, check status with Mercado Pago directly!
    // This provides 100% reliable instant confirmation even when running on localhost / dev where webhooks cannot reach.
    if (order.status === "PENDING" && order.mp_payment_id) {
      try {
        const mpStatus = await fetchMercadoPagoPaymentStatus(order.mp_payment_id);
        if (mpStatus.status === "approved") {
          const marked = dbRepository.markOrderAsPaid(order.id, order.mp_payment_id);
          if (marked) {
            order = dbRepository.getOrderById(id) || order;
            // Send Discord Purchase Notification via Webhook
            sendDiscordPurchaseNotification(order).catch((err) =>
              console.error("[Order Status] Error sending discord webhook:", err)
            );
          }
        }
      } catch (mpErr) {
        console.warn("[Order Status] Failed to poll Mercado Pago status:", mpErr);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      totalAmount: order.total_amount,
      paidAt: order.paid_at,
      deliveredAt: order.delivered_at,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 }
    );
  }
}
