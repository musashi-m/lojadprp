import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";
import { authenticateFiveMRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authenticateFiveMRequest(req)) {
    return NextResponse.json(
      { success: false, error: "Acesso não autorizado para o FiveM" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Handle expiration command acknowledgment
    if (id.startsWith("EXP-")) {
      const expId = id.replace("EXP-", "");
      dbRepository.markExpirationProcessed(
        expId,
        typeof body.response === "string" ? body.response : JSON.stringify(body)
      );
      return NextResponse.json({
        success: true,
        orderId: id,
        status: "EXPIRED_DELIVERED",
        deliveredAt: new Date().toISOString(),
      });
    }

    const order = dbRepository.getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    dbRepository.markOrderAsDelivered(
      id,
      typeof body.response === "string" ? body.response : JSON.stringify(body)
    );

    return NextResponse.json({
      success: true,
      orderId: id,
      status: "DELIVERED",
      deliveredAt: new Date().toISOString(),
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

