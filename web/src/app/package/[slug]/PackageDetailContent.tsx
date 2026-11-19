"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import {
  getProductDescription,
  StoreProduct,
} from "@/data/mockProducts";
import { formatCurrency } from "@/lib/utils";
import {
  ChevronRight,
  TrendingDown,
  ShoppingBag,
  Plus,
  Zap,
  PackageCheck,
  ShieldCheck,
  CreditCard,
  Check,
  Terminal,
} from "lucide-react";

interface PackageDetailContentProps {
  product: StoreProduct;
}

export const PackageDetailContent: React.FC<PackageDetailContentProps> = ({
  product,
}) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);

  const desc = getProductDescription(product);

  const handleAddToCart = () => {
    addToCart(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNowDirect = () => {
    addToCart(product);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen text-[#fafafa] flex flex-col font-sans bg-transparent">
      <Navbar searchQuery="" onSearchChange={() => {}} />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6 font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Início
            </Link>
            <ChevronRight className="size-3 text-zinc-600" />
            <Link
              href={`/#${product.category}`}
              className="uppercase hover:text-white transition-colors"
            >
              {product.category}
            </Link>
            <ChevronRight className="size-3 text-zinc-600" />
            <span className="text-zinc-200 truncate">{product.name}</span>
          </nav>

          {/* CentralCart Package Detail Two-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[2.5fr_1fr] gap-6">
            {/* Left Column: Product Box + Description */}
            <div className="space-y-6 min-w-0">
              {/* Product Box */}
              <div className="border border-white/10 bg-white/[2%] backdrop-blur-sm rounded-[0.6rem] p-5 sm:p-6 shadow-xl">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Package Image */}
                  <div className="w-full md:w-1/2 min-w-0 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="rounded-md w-full object-cover border border-white/10 bg-zinc-950 aspect-[4/3] sm:aspect-square"
                    />
                  </div>

                  {/* Details & Actions */}
                  <div className="flex flex-col w-full flex-1 justify-between">
                    <div>
                      <h1 className="font-kanit text-xl sm:text-2xl font-bold text-white leading-tight">
                        {product.name}
                      </h1>

                      {/* Badges Bar */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs bg-white/10 font-medium rounded-[4px] text-zinc-300">
                          1 venda
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs bg-white/10 font-medium rounded-[4px] text-zinc-300">
                          100+ em estoque
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs bg-amber-500 font-bold text-zinc-950 rounded-[4px]">
                          <Zap className="w-3.5 h-3.5 mr-1 fill-zinc-950" />
                          Entrega automática
                        </span>
                      </div>

                      {/* Pricing Row */}
                      {product.originalPrice && product.discount ? (
                        <div className="flex gap-2 items-center mb-1">
                          <p className="text-sm leading-none line-through text-zinc-500 font-mono">
                            {formatCurrency(product.originalPrice)}
                          </p>

                          <div className="h-5 rounded-md text-xs bg-amber-500/10 px-1 text-amber-400 border border-amber-500/20 inline-flex gap-1 items-center font-bold">
                            <TrendingDown className="size-3.5" />
                            <span>{product.discount}% OFF</span>
                          </div>
                        </div>
                      ) : null}

                      <div className="mb-6">
                        <h2 className="font-kanit text-3xl font-extrabold text-white leading-tight">
                          {formatCurrency(product.price)}
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          À vista no Pix
                        </p>
                      </div>
                    </div>

                    {/* Action Box */}
                    <div className="mt-auto w-full flex flex-col gap-2.5 rounded-[0.6rem] p-3 border border-white/10 bg-white/[1%]">
                      <button
                        onClick={handleBuyNowDirect}
                        className="btn-primary h-11 w-full text-sm font-bold flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Comprar agora</span>
                      </button>

                      <button
                        onClick={handleAddToCart}
                        className="btn-secondary h-11 w-full text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        {addedFeedback ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Adicionado ao carrinho!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Adicionar ao carrinho</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="border border-white/10 bg-white/[2%] backdrop-blur-sm p-6 rounded-[0.6rem]">
                <h3 className="font-kanit text-lg font-bold text-white border-b border-white/10 pb-3 mb-4">
                  Descrição
                </h3>

                <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                  <p>{desc.overview}</p>

                  {desc.sections?.map((sec, idx) => (
                    <div key={idx} className="space-y-2 pt-2">
                      <h4 className="font-kanit font-bold text-amber-400 text-sm tracking-wider uppercase">
                        {sec.title}
                      </h4>

                      {Array.isArray(sec.content) ? (
                        <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                          {sec.content.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-zinc-300">{sec.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Security & Delivery Badges */}
            <div className="space-y-4 md:max-w-sm w-full">
              {/* Immediate Delivery */}
              <div className="p-4 bg-white/[2%] backdrop-blur-sm border border-white/10 rounded-[0.6rem]">
                <div className="flex items-center gap-2 text-amber-400">
                  <PackageCheck className="size-5" />
                  <p className="font-kanit font-bold text-sm text-white">
                    Entrega imediata
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                  Receba o seu pacote imediatamente após o pagamento.
                </p>
              </div>

              {/* Total Security */}
              <div className="p-4 bg-white/[2%] backdrop-blur-sm border border-white/10 rounded-[0.6rem]">
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldCheck className="size-5" />
                  <p className="font-kanit font-bold text-sm text-white">
                    Segurança total
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                  Seus dados são criptografados de ponta-a-ponta durante todo o processo.
                </p>
              </div>

              {/* Payment Methods */}
              <div className="p-4 bg-white/[2%] backdrop-blur-sm border border-white/10 rounded-[0.6rem]">
                <div className="flex items-center gap-2 text-amber-400">
                  <CreditCard className="size-5" />
                  <p className="font-kanit font-bold text-sm text-white">
                    Formas de pagamento
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                  Aceitamos os meios de pagamentos mais populares!
                </p>

                <div className="flex items-center gap-3 mt-3 bg-[#09090b] py-2 px-3 rounded-[0.6rem] border border-white/10 w-fit">
                  <img
                    src="https://distritopaulista.centralcart.ai/cdn/public/gateway-icons/icon-pix.svg"
                    alt="PIX"
                    className="w-6 h-6 object-contain"
                  />
                  <img
                    src="https://distritopaulista.centralcart.ai/cdn/public/gateway-icons/icon-mercadopago.svg"
                    alt="Mercado Pago"
                    className="w-6 h-6 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
