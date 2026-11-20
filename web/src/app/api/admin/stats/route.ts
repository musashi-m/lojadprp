import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { dbRepository } from "@/lib/db";

export async function GET(req: NextRequest) {
  const isAuth = await isAdminAuthenticated(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const stats = dbRepository.getAdminStats();
  const recentOrders = dbRepository.getAllOrders(30);

  return NextResponse.json({
    success: true,
    stats,
    recentOrders,
  });
}

