"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PixCheckoutModal } from "@/components/PixCheckoutModal";
import { CitizenModal } from "@/components/CitizenModal";
import { formatCurrency } from "@/lib/utils";
import { STORE_CONFIG } from "@/data/mockProducts";
import {
  ChevronRight,
  ShieldCheck,
  Plus,
  Minus,
  X,
  Zap,
  Tag,
  Disc as DiscordIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function CheckoutPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discountAmount,
    finalTotal,
    couponCode,
    applyCoupon,
    discordUser,
    loginWithDiscord,
    logoutDiscord,
    characterId,
    setCharacterId,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "mercadopago">("pix");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState("");
  const [activeQrCode, setActiveQrCode] = useState("");
  const [activeQrCodeBase64, setActiveQrCodeBase64] = useState("");
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (cart.length === 0) {
      setValidationError("Seu carrinho está vazio.");
      return;
    }

    if (!discordUser) {
      setValidationError("É obrigatório entrar com o Discord para vincular sua conta antes de pagar.");
      return;
    }

    if (!characterId.trim()) {
      setValidationError("Informe 'Seu ID na cidade' para a entrega dos itens.");
      return;
    }

    if (!acceptedTerms) {
      setValidationError("Você precisa aceitar os termos e condições desta compra.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          cpf,
          characterId,
          discordUser,
          couponCode,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setValidationError(data.error || "Erro ao gerar PIX");
        return;
      }

      setActiveOrderId(data.orderId);
      setActiveQrCode(data.qrCode);
      setActiveQrCodeBase64(data.qrCodeBase64 || "");
      setIsPixModalOpen(true);
    } catch {
      setValidationError("Falha ao comunicar com o servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-[#fafafa] flex flex-col font-sans bg-transparent">
      <Navbar
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => {}}
        citizenId={characterId}
        onOpenCitizenModal={() => setIsCitizenModalOpen(true)}
        searchQuery=""
        onSearchChange={() => {}}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs & Title */}
          <div className="mb-8">
            <h1 className="font-kanit text-2xl sm:text-3xl font-extrabold text-white">
              Checkout
            </h1>
            <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
              <Link href="/" className="hover:text-white transition-colors">
                Início
              </Link>
              <ChevronRight className="size-3 text-zinc-600" />
              <span className="text-zinc-200">Checkout</span>
            </nav>
          </div>

          <form onSubmit={handleSubmitPayment}>
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
              {/* LEFT COLUMN: Payment Methods + Contact & Discord + Terms */}
              <div className="space-y-6">
                {/* Formas de pagamento */}
                <div className="rounded-[0.8rem] border border-white/10 bg-white/[2%] backdrop-blur-sm p-6 shadow-xl">
                  <h2 className="font-kanit font-bold text-base sm:text-lg text-white mb-4">
                    Formas de pagamento
                  </h2>

                  <div className="space-y-3">
                    {/* PIX Option */}
                    <div
                      onClick={() => setPaymentMethod("pix")}
                      className={`cursor-pointer flex items-center justify-between rounded-[0.7rem] p-4 transition-all border-2 ${
                        paymentMethod === "pix"
                          ? "border-[#ef9f00] bg-white/[4%] shadow-[0_0_15px_-3px_rgba(239,159,0,0.2)]"
                          : "border-white/10 bg-white/[1%] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="size-9 rounded-md bg-[#32bcad26] border border-[#32bcad4d] p-1.5 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-full h-full text-[#32bcad]"
                            viewBox="0 0 512 512"
                            fill="currentColor"
                          >
                            <path d="M407.4 207.6l-85.3-85.3c-15.6-15.6-40.9-15.6-56.6 0l-85.3 85.3c-15.6 15.6-15.6 40.9 0 56.6l85.3 85.3c15.6 15.6 40.9 15.6 56.6 0l85.3-85.3c15.6-15.6 15.6-40.9 0-56.6zm-113.6 56.6l-56.6-56.6 56.6-56.6 56.6 56.6-56.6 56.6z" />
                          </svg>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-kanit font-bold text-sm text-white">
                              Pix
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <Zap className="size-2.5 fill-emerald-400" />
                              Mais rápido
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">Aprovação imediata</p>
                        </div>
                      </div>

                      <div
                        className={`size-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "pix"
                            ? "border-[#ef9f00] bg-[#ef9f00]"
                            : "border-white/20"
                        }`}
                      >
                        {paymentMethod === "pix" && (
                          <div className="size-1.5 rounded-full bg-zinc-950" />
                        )}
                      </div>
                    </div>

                    {/* Mercado Pago Option */}
                    <div
                      onClick={() => setPaymentMethod("mercadopago")}
                      className={`cursor-pointer flex items-center justify-between rounded-[0.7rem] p-4 transition-all border-2 ${
                        paymentMethod === "mercadopago"
                          ? "border-[#ef9f00] bg-white/[4%]"
                          : "border-white/10 bg-white/[1%] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="size-9 rounded-md bg-[#009ee326] border border-[#009ee34d] p-1.5 flex items-center justify-center flex-shrink-0">
                          <img
                            src="https://distritopaulista.centralcart.ai/cdn/public/gateway-icons/icon-mercadopago.svg"
                            alt="Mercado Pago"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div>
                          <span className="font-kanit font-bold text-sm text-white">
                            Mercado Pago
                          </span>
                          <p className="text-xs text-zinc-400">Aprovação imediata</p>
                        </div>
                      </div>

                      <div
                        className={`size-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "mercadopago"
                            ? "border-[#ef9f00] bg-[#ef9f00]"
                            : "border-white/20"
                        }`}
                      >
                        {paymentMethod === "mercadopago" && (
                          <div className="size-1.5 rounded-full bg-zinc-950" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações de contato */}
                <div className="rounded-[0.8rem] border border-white/10 bg-white/[2%] backdrop-blur-sm p-6 shadow-xl space-y-4">
                  <h2 className="font-kanit font-bold text-base sm:text-lg text-white">
                    Informações de contato
                  </h2>

                  {/* Discord Login Button or Connected State */}
                  {discordUser ? (
                    <div className="flex items-center justify-between p-3.5 rounded-[0.6rem] bg-[#5865F2]/10 border border-[#5865F2]/30">
                      <div className="flex items-center gap-3">
                        <img
                          src={discordUser.avatar || STORE_CONFIG.logoUrl}
                          alt="Discord Avatar"
                          className="size-9 rounded-full border border-[#5865F2]"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {discordUser.globalName || discordUser.username}
                            </span>
                            <span className="text-[10px] text-[#7983f5] font-mono">
                              @{discordUser.username}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            ID: {discordUser.id}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={logoutDiscord}
                        className="text-xs text-rose-400 hover:text-rose-300 underline"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={loginWithDiscord}
                        className="w-full flex items-center justify-center gap-2 rounded-[0.6rem] bg-[#5865F2] hover:bg-[#4752c4] text-white py-3 px-4 font-bold text-sm shadow-md transition-all active:scale-[0.99]"
                      >
                        <DiscordIcon className="size-5" />
                        <span>Entrar com o Discord</span>
                      </button>
                    </div>
                  )}

                  {/* Input Fields */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nome completo"
                        className="w-full h-11 rounded-[0.6rem] bg-white/[0.04] border border-white/10 px-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#ef9f00] transition-colors"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full h-11 rounded-[0.6rem] bg-white/[0.04] border border-white/10 px-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#ef9f00] transition-colors"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="CPF"
                        className="w-full h-11 rounded-[0.6rem] bg-white/[0.04] border border-white/10 px-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#ef9f00] transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        value={characterId}
                        onChange={(e) => setCharacterId(e.target.value)}
                        placeholder="Seu ID na cidade"
                        className="w-full h-11 rounded-[0.6rem] bg-white/[0.04] border border-white/10 px-4 text-sm font-mono text-white placeholder-zinc-500 outline-none focus:border-[#ef9f00] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Validation Error Message */}
                {validationError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-[0.6rem] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    <AlertCircle className="size-4 shrink-0 text-rose-400" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Terms and Submit Button */}
                <div className="space-y-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="size-4 rounded bg-white/10 border-white/20 text-[#ef9f00] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#ef9f00]"
                    />
                    <span>
                      Eu aceito os{" "}
                      <span className="font-bold text-white underline">
                        termos e condições
                      </span>{" "}
                      desta compra.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-[0.6rem] bg-[#ef9f00] hover:bg-[#d98e00] disabled:opacity-60 text-zinc-950 font-kanit font-extrabold text-base tracking-wide flex items-center justify-center transition-all shadow-[0_0_20px_-3px_rgba(239,159,0,0.4)] active:scale-[0.99]"
                  >
                    {isSubmitting ? "Gerando Pix..." : `Pagar ${formatCurrency(finalTotal)}`}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Resumo do pedido + Cupom + Totais */}
              <div className="space-y-4">
                <div className="rounded-[0.8rem] border border-white/10 bg-white/[2%] backdrop-blur-sm p-6 shadow-xl space-y-6">
                  {/* Title & Pagamento Seguro Badge */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="font-kanit font-bold text-base sm:text-lg text-white">
                      Resumo do pedido
                    </h2>

                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                      <ShieldCheck className="size-3.5" />
                      <span>Pagamento seguro</span>
                    </div>
                  </div>

                  {/* Items List */}
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      Seu carrinho está vazio.
                    </div>
                  ) : (
                    <div className="space-y-4 divide-y divide-white/5">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between gap-3 pt-3 first:pt-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="size-12 rounded-md object-cover border border-white/10 bg-zinc-950 flex-shrink-0"
                            />

                            <div className="min-w-0">
                              <h4 className="font-kanit font-bold text-xs sm:text-sm text-white truncate">
                                {item.product.name}
                              </h4>
                              <p className="text-xs text-zinc-400 font-mono">
                                {formatCurrency(item.product.price)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Stepper */}
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-md p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="size-5 rounded flex items-center justify-center text-zinc-400 hover:text-white"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="font-mono text-xs font-bold text-white px-1">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="size-5 rounded flex items-center justify-center text-zinc-400 hover:text-white"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                            >
                              <X className="size-4" />
                            </button>

                            {/* Item total */}
                            <span className="font-kanit font-bold text-sm text-white w-20 text-right">
                              {formatCurrency(item.product.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coupon Input Box */}
                  <div className="pt-2">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Digite seu cupom de desconto"
                        className="flex-1 h-10 rounded-l-[0.6rem] bg-white/[0.04] border border-white/10 border-r-0 px-3.5 text-xs text-white placeholder-zinc-500 outline-none uppercase font-mono focus:border-[#ef9f00]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="h-10 px-4 rounded-r-[0.6rem] bg-[#ef9f00] hover:bg-[#d98e00] text-zinc-950 font-kanit font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Tag className="size-3.5" />
                        <span>Aplicar</span>
                      </button>
                    </div>

                    {couponFeedback && (
                      <p
                        className={`text-xs mt-1.5 ${
                          couponFeedback.success ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {couponFeedback.message}
                      </p>
                    )}
                  </div>

                  {/* Totals Breakdown */}
                  <div className="space-y-2 border-t border-white/10 pt-4 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal</span>
                      <span className="font-mono text-white">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>Descontos</span>
                      <span
                        className={`font-mono ${
                          discountAmount > 0 ? "text-emerald-400" : "text-white"
                        }`}
                      >
                        {formatCurrency(discountAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-white/10 text-sm font-kanit font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-base text-white">
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />

      {/* PIX Instant Modal */}
      <PixCheckoutModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        orderId={activeOrderId}
        qrCode={activeQrCode}
        qrCodeBase64={activeQrCodeBase64}
        items={cart}
        totalAmount={finalTotal}
        characterId={characterId}
        onPaymentSuccess={() => {
          clearCart();
        }}
      />

      {/* CitizenID Binding Modal */}
      <CitizenModal
        isOpen={isCitizenModalOpen}
        onClose={() => setIsCitizenModalOpen(false)}
        currentCitizenId={characterId}
        onSave={setCharacterId}
      />
    </div>
  );
}
