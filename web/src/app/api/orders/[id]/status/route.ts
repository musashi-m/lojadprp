import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = dbRepository.getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      );
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

