import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { dbRepository } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const data = await req.json();
    if (!data.label) {
      return NextResponse.json({ success: false, error: "Nome (label) obrigatório" }, { status: 400 });
    }

    const success = dbRepository.updateCategory(id, {
      label: data.label,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
    });

    if (!success) {
      return NextResponse.json({ success: false, error: "Categoria não encontrada" }, { status: 404 });
    }

    const updated = dbRepository.getCategoryById(id);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    dbRepository.logAdminAction(
      session.email,
      "EDITOU_CATEGORIA",
      `Editou categoria: ${updated?.label || id} (ID: ${id})`,
      ip
    );

    return NextResponse.json({ success: true, category: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Erro ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = dbRepository.getCategoryById(id);
  const success = dbRepository.deleteCategory(id);
  if (!success) {
    return NextResponse.json({ success: false, error: "Categoria não encontrada" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  dbRepository.logAdminAction(
    session.email,
    "EXCLUIU_CATEGORIA",
    `Excluiu categoria: ${existing?.label || id} (ID: ${id})`,
    ip
  );

  return NextResponse.json({ success: true });
}
