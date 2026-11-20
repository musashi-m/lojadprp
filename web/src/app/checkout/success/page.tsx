"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { CheckCircle2, ArrowRight, ShieldCheck, Home } from "lucide-react";
import { STORE_CONFIG } from "@/data/mockProducts";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || searchParams.get("external_reference") || "";
  const [orderData, setOrderData] = useState<{
    status: string;
    totalAmount?: number;
  } | null>(null);

  useEffect(() => {
    // Fire celebratory confetti
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#ef9f00", "#10b981", "#32bcad", "#ffffff"],
    });

    if (orderId) {
      // Poll order status to display updated info
      fetch(`/api/orders/${orderId}/status`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrderData(data);
          }
        })
        .catch(() => {});
    }
  }, [orderId]);

  return (
    <div className="min-h-screen text-[#fafafa] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ef9f00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-950/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center relative z-10 space-y-6">
        <div className="mx-auto size-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
          <CheckCircle2 className="size-10 text-emerald-400" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
            Mercado Pago • Pedido Concluído
          </span>
          <h1 className="font-kanit text-2xl sm:text-3xl font-extrabold text-white">
            Pagamento Aprovado!
          </h1>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            Sua compra no <strong className="text-white">{STORE_CONFIG.serverName}</strong> foi confirmada e os itens estão sendo entregues in-game.
          </p>
        </div>

        {orderId && (
          <div className="bg-white/[3%] border border-white/5 rounded-xl p-4 text-left space-y-2 text-xs text-zinc-300">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Número do Pedido:</span>
              <span className="font-mono font-bold text-white">{orderId}</span>
            </div>
            {orderData?.totalAmount && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Valor Pago:</span>
                <span className="font-bold text-[#ef9f00]">
                  R$ {orderData.totalAmount.toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-white/5">
              <span className="text-zinc-500">Entrega in-game:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="size-3.5" /> Automática via Qbox
              </span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-kanit font-bold text-sm bg-gradient-to-r from-[#ef9f00] to-[#f5b026] text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#ef9f00]/20"
          >
            <Home className="size-4" />
            Voltar para a Loja Oficial
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-zinc-400">
          Carregando confirmação...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

