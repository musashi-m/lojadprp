import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Digite um código de cupom." },
        { status: 400 }
      );
    }

    const clean = code.trim().toUpperCase();
    const coupon = dbRepository.validateCoupon(clean);

    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: "Cupom inválido, expirado ou com limite de usos atingido.",
      });
    }

    return NextResponse.json({
      success: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      message: `Cupom ${coupon.code} (${coupon.discountPercent}% OFF) aplicado com sucesso!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Erro ao validar cupom" },
      { status: 500 }
    );
  }
}

