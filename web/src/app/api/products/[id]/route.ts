import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { dbRepository } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = dbRepository.getProductByIdOrSlug(id);
  if (!product) {
    return NextResponse.json({ success: false, error: "Produto não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ success: true, product });
}

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
    const success = dbRepository.updateProduct(id, data);
    if (!success) {
      return NextResponse.json({ success: false, error: "Produto não encontrado" }, { status: 404 });
    }
    const updated = dbRepository.getProductByIdOrSlug(id);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    dbRepository.logAdminAction(
      session.email,
      "EDITOU_PRODUTO",
      `Editou o produto: ${updated?.name || id} (ID: ${id})`,
      ip
    );

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Erro ao atualizar produto" }, { status: 500 });
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
  const existing = dbRepository.getProductByIdOrSlug(id);
  const success = dbRepository.deleteProduct(id);
  if (!success) {
    return NextResponse.json({ success: false, error: "Produto não encontrado" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  dbRepository.logAdminAction(
    session.email,
    "EXCLUIU_PRODUTO",
    `Excluiu o produto: ${existing?.name || id} (ID: ${id})`,
    ip
  );

  return NextResponse.json({ success: true });
}
