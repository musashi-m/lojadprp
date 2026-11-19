import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";

export async function POST(
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

    const updated = dbRepository.markOrderAsPaid(id);

    return NextResponse.json({
      success: true,
      orderId: id,
      status: "PAID",
      message: "Pagamento aprovado com sucesso! Entrega liberada para o servidor.",
      wasUpdated: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao simular pagamento",
      },
      { status: 500 }
    );
  }
}

