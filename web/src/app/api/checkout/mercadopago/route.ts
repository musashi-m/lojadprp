import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbRepository } from "@/lib/db";
import { createMercadoPagoPreference } from "@/lib/mercadopago";
import { PRODUCTS_DATA } from "@/data/mockProducts";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  characterId: z.string().min(1, "ID na cidade é obrigatório"),
  discordUser: z
    .object({
      id: z.string(),
      username: z.string(),
      globalName: z.string().optional().nullable(),
      avatar: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  couponCode: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Carrinho vazio"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { fullName, email, cpf, characterId, discordUser, couponCode, items } = parsed.data;

    // Server-side price calculation
    let subtotal = 0;
    const validatedItems: {
      product_id: string;
      product_slug: string;
      product_name: string;
      category: string;
      unit_price: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const product =
        dbRepository.getProductByIdOrSlug(item.productId) ||
        PRODUCTS_DATA.find((p) => p.id === item.productId || p.slug === item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Produto não encontrado: ${item.productId}` },
          { status: 404 }
        );
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        product_id: product.id,
        product_slug: product.slug,
        product_name: product.name,
        category: product.category,
        unit_price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // Apply Coupon
    let discountAmount = 0;
    let validatedCouponCode: string | null = null;
    if (couponCode) {
      const coupon = dbRepository.validateCoupon(couponCode);
      if (coupon) {
        validatedCouponCode = coupon.code;
        discountAmount = (subtotal * coupon.discountPercent) / 100;
      }
    }

    const finalTotal = Math.max(0.01, Number((subtotal - discountAmount).toFixed(2)));
    const orderId = `DPRP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 1. Create Order in DB (status: PENDING)
    dbRepository.createOrder(
      {
        id: orderId,
        mp_payment_id: null,
        status: "PENDING",
        character_id: characterId,
        discord_id: discordUser?.id || null,
        discord_username: discordUser?.username || null,
        customer_name: fullName,
        customer_email: email,
        customer_cpf: cpf,
        total_amount: finalTotal,
        discount_amount: discountAmount,
        coupon_code: validatedCouponCode,
        payment_method: "mercadopago",
        qr_code: null,
        qr_code_base64: null,
        ticket_url: null,
        expires_at: null,
        paid_at: null,
        delivered_at: null,
      },
      validatedItems
    );

    // 2. Generate Preference via Mercado Pago Checkout Pro
    // Adjust item unit prices if there's a coupon discount proportionally
    const discountRatio = subtotal > 0 ? finalTotal / subtotal : 1;
    const preferenceItems = validatedItems.map((vi) => ({
      title: `${vi.product_name} (${vi.quantity}x)`,
      quantity: vi.quantity,
      unitPrice: Number((vi.unit_price * discountRatio).toFixed(2)),
    }));

    const prefResult = await createMercadoPagoPreference({
      orderId,
      amount: finalTotal,
      items: preferenceItems,
      customerName: fullName,
      customerEmail: email,
      customerCpf: cpf,
    });

    return NextResponse.json({
      success: true,
      orderId,
      initPoint: prefResult.initPoint,
      totalAmount: finalTotal,
    });
  } catch (error) {
    console.error("[Checkout Mercado Pago] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao processar checkout",
      },
      { status: 500 }
    );
  }
}

