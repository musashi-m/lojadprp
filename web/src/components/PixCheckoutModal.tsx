"use client";

import React, { useState, useEffect } from "react";
import { CartItem } from "@/types/store";
import { formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";
import { PixIcon } from "@/components/PixIcon";
import {
  X,
  Copy,
  Check,
  Zap,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";

interface PixCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  qrCode: string;
  qrCodeBase64?: string;
  totalAmount: number;
  characterId: string;
  items: CartItem[];
  onPaymentSuccess: () => void;
}

export const PixCheckoutModal: React.FC<PixCheckoutModalProps> = ({
  isOpen,
  onClose,
  orderId,
  qrCode,
  qrCodeBase64,
  totalAmount,
  characterId,
  items,
  onPaymentSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "approved">(
    "pending"
  );
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setPaymentStatus("pending");
    setTimeLeft(900);

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Real-time status polling every 3 seconds
  useEffect(() => {
    if (!isOpen || !orderId || paymentStatus === "approved") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID" || data.status === "DELIVERED") {
            setPaymentStatus("approved");
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#ef9f00", "#10b981", "#32bcad", "#ffffff"],
            });
            onPaymentSuccess();
          }
        }
      } catch {
        // network polling silent retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, orderId, paymentStatus, onPaymentSuccess]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleCopy = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    if (isSimulating || !orderId) return;
    setIsSimulating(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/simulate-payment`, {
        method: "POST",
      });
      if (res.ok) {
        setPaymentStatus("approved");
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
          colors: ["#ef9f00", "#10b981", "#32bcad", "#ffffff"],
        });
        onPaymentSuccess();
      }
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-[0.8rem] border border-white/10 bg-[#0d0f17] p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[0.6rem] bg-[#32bcad26] border border-[#32bcad4d] flex items-center justify-center text-[#32bcad] p-2">
              <PixIcon className="w-full h-full text-[#32bcad]" />
            </div>
            <div>
              <h3 className="font-kanit text-lg font-bold text-white flex items-center gap-2">
                <span>Pagamento via Pix</span>
                <span className="text-[10px] font-mono text-zinc-400 font-normal">
                  #{orderId}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Aprovação automática em poucos segundos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content based on status */}
        {paymentStatus === "approved" ? (
          /* ================= APPROVED STATE ================= */
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <h3 className="font-kanit text-2xl font-black text-white">
                Pagamento Confirmado!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                Seu pagamento de{" "}
                <span className="text-white font-bold">{formatCurrency(totalAmount)}</span> foi
                aprovado com sucesso.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 max-w-sm mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Entrega para o ID:</span>
                <span className="font-mono font-bold text-amber-400">{characterId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Itens adquiridos:</span>
                <span className="text-white font-bold">{items.map((i) => i.product.name).join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Status do Pedido:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="size-3.5" />
                  Liberado para o servidor
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-primary w-full max-w-sm h-11 text-sm font-bold"
            >
              Concluir & Voltar para a Loja
            </button>
          </div>
        ) : (
          /* ================= PENDING STATE ================= */
          <div className="mt-5 space-y-5">
            {/* Amount & Countdown */}
            <div className="flex items-center justify-between rounded-[0.6rem] bg-white/5 border border-white/10 p-3 text-xs">
              <div>
                <span className="text-zinc-400">Total a pagar:</span>
                <div className="font-kanit text-lg font-extrabold text-amber-400">
                  {formatCurrency(totalAmount)}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-mono font-bold text-xs">{formattedTime}</span>
              </div>
            </div>

            {/* QR Code Presentation Box */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
              <div className="relative p-3 rounded-2xl bg-white shadow-xl">
                {qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${qrCodeBase64}`}
                    alt="QR Code PIX Mercado Pago"
                    className="h-44 w-44 object-contain"
                  />
                ) : (
                  <svg
                    className="h-44 w-44"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="24" height="24" fill="#09090b" />
                    <rect x="14" y="14" width="16" height="16" fill="white" />
                    <rect x="18" y="18" width="8" height="8" fill="#09090b" />

                    <rect x="66" y="10" width="24" height="24" fill="#09090b" />
                    <rect x="70" y="14" width="16" height="16" fill="white" />
                    <rect x="74" y="18" width="8" height="8" fill="#09090b" />

                    <rect x="10" y="66" width="24" height="24" fill="#09090b" />
                    <rect x="14" y="70" width="16" height="16" fill="white" />
                    <rect x="18" y="74" width="8" height="8" fill="#09090b" />

                    <rect x="42" y="14" width="6" height="6" fill="#09090b" />
                    <rect x="52" y="14" width="6" height="12" fill="#09090b" />
                    <rect x="42" y="26" width="12" height="6" fill="#09090b" />
                    <rect x="14" y="42" width="6" height="12" fill="#09090b" />
                    <rect x="26" y="46" width="14" height="6" fill="#09090b" />
                    <rect x="44" y="44" width="12" height="12" fill="#ef9f00" />
                    <rect x="64" y="42" width="8" height="16" fill="#09090b" />
                    <rect x="78" y="44" width="12" height="8" fill="#09090b" />
                    <rect x="42" y="66" width="16" height="8" fill="#09090b" />
                    <rect x="42" y="78" width="8" height="12" fill="#09090b" />
                    <rect x="66" y="66" width="8" height="8" fill="#09090b" />
                    <rect x="78" y="74" width="12" height="16" fill="#09090b" />
                  </svg>
                )}

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="size-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-xl border-2 border-white">
                    <PixIcon className="w-full h-full text-[#32bcad]" />
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-zinc-300">
                Abra o app do seu banco e escaneie o QR Code acima
              </p>
            </div>

            {/* PIX Copia e Cola */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Código PIX Copia e Cola
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={qrCode || "Carregando código..."}
                  className="w-full rounded-[0.6rem] bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-xs font-mono text-zinc-400 pr-24 outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`btn-primary absolute right-1.5 top-1.5 bottom-1.5 h-auto px-3 text-xs ${
                    copied ? "bg-emerald-500 text-zinc-950" : ""
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Auto-check spinner */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
              <Loader2 className="size-3.5 animate-spin text-amber-400" />
              <span>Aguardando confirmação do pagamento pelo banco...</span>
            </div>

            {/* Test Simulation Button */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="w-full btn-secondary h-10 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                    <span>Processando confirmação...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>[Demonstração] Simular Pagamento Instantâneo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
