import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { dbRepository } from "@/lib/db";

export async function GET() {
  const categories = dbRepository.getAllCategories();
  return NextResponse.json({ success: true, categories });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    if (!data.id || !data.label) {
      return NextResponse.json({ success: false, error: "ID (slug) e Nome (label) são obrigatórios" }, { status: 400 });
    }

    const created = dbRepository.createCategory({
      id: data.id,
      label: data.label,
      displayOrder: data.displayOrder ? Number(data.displayOrder) : 0,
    });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    dbRepository.logAdminAction(
      session.email,
      "CRIOU_CATEGORIA",
      `Criou categoria: ${created.label} (ID: ${created.id})`,
      ip
    );

    return NextResponse.json({ success: true, category: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Erro ao criar categoria" }, { status: 500 });
  }
}
