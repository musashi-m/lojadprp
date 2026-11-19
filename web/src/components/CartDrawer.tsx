"use client";

import React, { useState } from "react";
import { CartItem } from "@/types/store";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  Tag,
  User,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  citizenId: string;
  onUpdateCitizenId: (id: string) => void;
  onProceedToCheckout: (appliedDiscount: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  citizenId,
  onUpdateCitizenId,
  onProceedToCheckout,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [inputCitizen, setInputCitizen] = useState(citizenId);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const discountAmount = (subtotal * discountPercent) / 100;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "DISTRITO10" || code === "BEMVINDO10") {
      setDiscountPercent(10);
      setCouponSuccess("Cupom de 10% aplicado!");
    } else if (code === "PAULISTA20") {
      setDiscountPercent(20);
      setCouponSuccess("Cupom especial de 20% aplicado!");
    } else {
      setCouponError("Cupom inválido. Tente DISTRITO10");
    }
  };

  const handleSaveCitizen = () => {
    if (inputCitizen.trim()) {
      onUpdateCitizenId(inputCitizen.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[#0d0f17] border-l border-white/10 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[0.6rem] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-kanit font-bold text-base text-white">Carrinho</h2>
                <p className="text-xs text-zinc-400">
                  {items.length === 0
                    ? "Seu carrinho está vazio"
                    : `${items.length} ${items.length === 1 ? "item" : "itens"}`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Items / Empty State */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-zinc-500 mb-4">
                  <ShoppingCart className="h-8 w-8 stroke-[1.5]" />
                </div>
                <h3 className="font-kanit text-sm font-semibold text-zinc-300">
                  Nenhum item adicionado
                </h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                  Navegue pelas categorias e clique em &quot;Comprar agora&quot; para adicionar pacotes.
                </p>
              </div>
            ) : (
              <>
                {/* CitizenID Requirement Box */}
                <div
                  className={`rounded-[0.6rem] p-3.5 border transition-all ${
                    citizenId
                      ? "bg-emerald-500/[0.05] border-emerald-500/20"
                      : "bg-amber-500/[0.08] border-amber-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-white font-kanit">
                      <User className="h-3.5 w-3.5 text-amber-400" />
                      Seu ID na cidade
                    </span>
                    {citizenId && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        VINCULADO
                      </span>
                    )}
                  </div>

                  {citizenId ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Entrega para:</span>
                      <span className="font-mono font-bold text-amber-400 bg-zinc-900 px-2 py-0.5 rounded border border-white/10">
                        {citizenId}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-amber-300/90 leading-tight">
                        Informe seu ID na cidade para a entrega automática:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inputCitizen}
                          onChange={(e) => setInputCitizen(e.target.value)}
                          placeholder="Ex: 142"
                          className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs font-mono text-white placeholder-zinc-600 outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCitizen}
                          className="btn-primary h-8 px-3 text-xs"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 rounded-[0.6rem] bg-white/[0.03] border border-white/10 p-3"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-14 w-14 rounded-md object-cover flex-shrink-0 border border-white/10 bg-zinc-950"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-kanit text-xs font-bold text-white truncate">
                          {item.product.name}
                        </h4>
                        <div className="font-kanit text-xs font-bold text-amber-400 mt-0.5">
                          {formatCurrency(item.product.price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-zinc-900 rounded-lg border border-white/10 p-1">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 rounded text-zinc-400 hover:text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-xs font-bold text-white px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 rounded text-zinc-400 hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="pt-2 border-t border-white/10">
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                    Cupom de Desconto
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Ex: DISTRITO10"
                        className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs uppercase font-mono text-white placeholder-zinc-600 outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn-secondary h-8 px-3 text-xs"
                    >
                      Aplicar
                    </button>
                  </div>

                  {couponSuccess && (
                    <p className="mt-1.5 text-[11px] text-emerald-400">{couponSuccess}</p>
                  )}
                  {couponError && (
                    <p className="mt-1.5 text-[11px] text-rose-400">{couponError}</p>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-white/10 bg-[#09090b] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-zinc-200">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto ({discountPercent}%)</span>
                    <span className="font-mono">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-400">
                  <span>Forma de Pagamento</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" /> PIX Automático
                  </span>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                  <span className="font-kanit text-sm font-bold text-white">Total</span>
                  <div className="text-right">
                    <div className="font-kanit text-xl font-bold text-amber-400">
                      {formatCurrency(finalTotal)}
                    </div>
                    <div className="text-[10px] text-zinc-500">Sem taxas adicionais</div>
                  </div>
                </div>
              </div>

              <button
                disabled={!citizenId}
                onClick={() => onProceedToCheckout(discountAmount)}
                className={`w-full btn-primary h-11 text-sm ${
                  !citizenId ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span>
                  {citizenId
                    ? "Finalizar Compra via PIX"
                    : "Informe o Passaporte para continuar"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
