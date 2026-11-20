import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { dbRepository } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const coupons = dbRepository.getAllCoupons();
  return NextResponse.json({ success: true, coupons });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    if (!data.code || typeof data.discountPercent !== "number") {
      return NextResponse.json({ success: false, error: "Código e porcentagem de desconto são obrigatórios" }, { status: 400 });
    }

    const coupon = dbRepository.createCoupon({
      code: data.code,
      discountPercent: data.discountPercent,
      maxUses: data.maxUses ? Number(data.maxUses) : undefined,
    });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    dbRepository.logAdminAction(
      session.email,
      "CRIOU_CUPOM",
      `Criou cupom: ${coupon.code} (${coupon.discountPercent}% OFF)`,
      ip
    );

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ success: false, error: "Código obrigatório" }, { status: 400 });
  }

  dbRepository.deleteCoupon(code);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  dbRepository.logAdminAction(
    session.email,
    "EXCLUIU_CUPOM",
    `Excluiu cupom: ${code}`,
    ip
  );

  return NextResponse.json({ success: true });
}
