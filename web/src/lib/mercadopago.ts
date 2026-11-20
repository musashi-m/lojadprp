import crypto from "node:crypto";

export interface CreatePixParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  description?: string;
}

export interface PixPaymentResult {
  paymentId: string;
  status: string;
  qrCode: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  expiresAt: string;
  isMock: boolean;
}

const MP_API_URL = "https://api.mercadopago.com/v1/payments";

export async function createMercadoPagoPix(params: CreatePixParams): Promise<PixPaymentResult> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

  // If token is missing or explicitly 'mock', use high-fidelity simulation
  if (!token || token === "mock" || token === "sandbox") {
    console.log("[MercadoPago] Running in Dev/Simulation mode. Order:", params.orderId);
    const mockPaymentId = `mp_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Genuine-looking PIX payload structure
    const mockCopiaECola = `00020126580014br.gov.bcb.pix0136${mockPaymentId}5204000053039865405${params.amount.toFixed(2)}5802BR5920DISTRITO PAULISTA RP6009SAO PAULO62070503***6304ABCD`;

    return {
      paymentId: mockPaymentId,
      status: "pending",
      qrCode: mockCopiaECola,
      expiresAt,
      isMock: true,
    };
  }

  // Real Mercado Pago API Call
  const cleanCpf = params.customerCpf.replace(/\D/g, "");
  const cleanEmail = params.customerEmail.trim();
  const cleanName = params.customerName.trim();
  const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  const payload: Record<string, unknown> = {
    transaction_amount: Number(params.amount.toFixed(2)),
    description: params.description || `Distrito Paulista RP - Pedido #${params.orderId}`,
    payment_method_id: "pix",
    external_reference: params.orderId,
    payer: {
      email: cleanEmail,
      first_name: cleanName.split(" ")[0] || "Cliente",
      last_name: cleanName.split(" ").slice(1).join(" ") || "DPRP",
      identification: {
        type: "CPF",
        number: cleanCpf,
      },
    },
  };

  // Only send notification_url if it's a valid public HTTPS URL (Mercado Pago rejects localhost/http)
  if (
    storeUrl &&
    storeUrl.startsWith("https://") &&
    !storeUrl.includes("localhost") &&
    !storeUrl.includes("127.0.0.1")
  ) {
    payload.notification_url = `${storeUrl}/api/webhooks/mercadopago`;
  }

  const response = await fetch(MP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Idempotency-Key": params.orderId,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[MercadoPago] Error creating PIX payment:", data);
    let errMsg = data.message || data.error || "Erro ao gerar PIX com o Mercado Pago";
    if (errMsg.includes("Unauthorized use of live credentials")) {
      errMsg = "Suas credenciais de produção do Mercado Pago ainda não foram ativadas. Acesse o painel e ative as 'Credenciais de produção' para receber pagamentos reais.";
    }
    throw new Error(errMsg);
  }

  const txData = data.point_of_interaction?.transaction_data;
  return {
    paymentId: String(data.id),
    status: data.status || "pending",
    qrCode: txData?.qr_code || "",
    qrCodeBase64: txData?.qr_code_base64 || undefined,
    ticketUrl: txData?.ticket_url || undefined,
    expiresAt: data.date_of_expiration || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    isMock: false,
  };
}

export async function fetchMercadoPagoPaymentStatus(paymentId: string): Promise<{
  id: string;
  status: "pending" | "approved" | "authorized" | "in_process" | "in_mediation" | "rejected" | "cancelled" | "refunded" | "charged_back";
  externalReference?: string;
  transactionAmount?: number;
}> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

  // If simulation mode:
  if (!token || token === "mock" || token === "sandbox") {
    return {
      id: paymentId,
      status: "approved",
    };
  }

  const response = await fetch(`${MP_API_URL}/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar pagamento no Mercado Pago: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: String(data.id),
    status: data.status,
    externalReference: data.external_reference,
    transactionAmount: data.transaction_amount,
  };
}

export function verifyMercadoPagoWebhookSignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  // If no secret configured in dev mode, allow pass
  if (!secret) return true;
  if (!signatureHeader) return false;

  try {
    // x-signature format: ts=123456789,v1=hash
    const parts = signatureHeader.split(",");
    let ts = "";
    let v1 = "";

    for (const part of parts) {
      const [key, val] = part.trim().split("=");
      if (key === "ts") ts = val;
      if (key === "v1") v1 = val;
    }

    if (!ts || !v1) return false;

    // Build manifest string: id:[data.id_url_param];request-id:[x-request-id_header];ts:[ts_header];
    const manifest = `id:${dataId};request-id:${requestId || ""};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const computedHash = hmac.digest("hex");

    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(v1));
  } catch {
    return false;
  }
}

export interface CreatePreferenceParams {
  orderId: string;
  amount: number;
  items: {
    title: string;
    quantity: number;
    unitPrice: number;
  }[];
  customerName: string;
  customerEmail: string;
  customerCpf: string;
}

export async function createMercadoPagoPreference(params: CreatePreferenceParams): Promise<{
  preferenceId: string;
  initPoint: string;
}> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  const storeUrl = process.env.STORE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  if (!token || token === "mock" || token === "sandbox") {
    return {
      preferenceId: `pref_sim_${Date.now()}`,
      initPoint: `${storeUrl}/checkout/success?order_id=${params.orderId}`,
    };
  }

  const cleanCpf = params.customerCpf.replace(/\D/g, "");
  const cleanEmail = params.customerEmail.trim();
  const cleanName = params.customerName.trim();

  const payload: Record<string, unknown> = {
    items: params.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      unit_price: Number(i.unitPrice.toFixed(2)),
      currency_id: "BRL",
    })),
    payer: {
      name: cleanName.split(" ")[0] || "Cliente",
      surname: cleanName.split(" ").slice(1).join(" ") || "DPRP",
      email: cleanEmail,
      identification: {
        type: "CPF",
        number: cleanCpf,
      },
    },
    external_reference: params.orderId,
    back_urls: {
      success: `${storeUrl}/checkout/success?order_id=${params.orderId}`,
      failure: `${storeUrl}/checkout?error=payment_failed`,
      pending: `${storeUrl}/checkout/success?order_id=${params.orderId}`,
    },
    auto_return: "approved",
  };

  if (
    storeUrl &&
    storeUrl.startsWith("https://") &&
    !storeUrl.includes("localhost") &&
    !storeUrl.includes("127.0.0.1")
  ) {
    payload.notification_url = `${storeUrl}/api/webhooks/mercadopago`;
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[MercadoPago] Error creating preference:", data);
    throw new Error(data.message || data.error || "Erro ao criar checkout do Mercado Pago");
  }

  return {
    preferenceId: String(data.id),
    initPoint: data.init_point,
  };
}

