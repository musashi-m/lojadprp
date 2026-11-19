import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";
import { authenticateFiveMRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!authenticateFiveMRequest(req)) {
    return NextResponse.json(
      { success: false, error: "Acesso não autorizado para o FiveM" },
      { status: 401 }
    );
  }

  try {
    const pending = dbRepository.getPendingDeliveries();

    return NextResponse.json({
      success: true,
      count: pending.length,
      deliveries: pending,
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

