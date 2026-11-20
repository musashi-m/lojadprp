import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { dbRepository } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";

  const products = dbRepository.getAllProducts({
    category,
    includeInactive,
  });

  return NextResponse.json({ success: true, products });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    if (!data.name || !data.slug || !data.category || typeof data.price !== "number") {
      return NextResponse.json(
        { success: false, error: "Nome, slug, categoria e preço numérico são obrigatórios" },
        { status: 400 }
      );
    }

    const created = dbRepository.createProduct({
      id: data.id,
      name: data.name,
      slug: data.slug,
      category: data.category,
      price: data.price,
      originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
      discount: data.discount ? Number(data.discount) : undefined,
      image: data.image || "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png",
      description: data.description,
      isActive: data.isActive !== false,
      displayOrder: data.displayOrder ? Number(data.displayOrder) : 0,
      commands: Array.isArray(data.commands) ? data.commands : undefined,
      cost: data.cost ? Number(data.cost) : undefined,
      stock: Boolean(data.stock),
      minQuantity: Boolean(data.minQuantity),
      limitPerUser: Boolean(data.limitPerUser),
      quantityLimit: Boolean(data.quantityLimit),
      removeAfter: data.removeAfter,
    });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    dbRepository.logAdminAction(
      session.email,
      "CRIOU_PRODUTO",
      `Criou o produto: ${created.name} (R$ ${created.price})`,
      ip
    );

    return NextResponse.json({ success: true, product: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Erro ao criar produto" }, { status: 500 });
  }
}
