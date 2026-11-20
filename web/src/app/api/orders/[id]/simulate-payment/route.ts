import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Simulação de pagamento desativada. As compras só podem ser confirmadas mediante pagamento real verificado pelo Mercado Pago.",
    },
    { status: 403 }
  );
}
