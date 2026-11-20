"use client";

import React from "react";
import Link from "next/link";
import { StoreProduct } from "@/data/mockProducts";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, ShoppingBag } from "lucide-react";
import { PixIcon } from "@/components/PixIcon";

interface ProductCardProps {
  product: StoreProduct;
  onBuyNow: (product: StoreProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuyNow }) => {
  return (
    <div className="relative h-full flex flex-col group rounded-[0.7rem] overflow-hidden border-2 shadow border-white/10 bg-white/[2%] backdrop-blur-sm hover:border-[#ef9f00] transition-all hover:scale-[102%]">
      {/* Clickable Image -> Product Page */}
      <Link
        href={`/package/${product.slug}`}
        className="overflow-hidden relative border-b-2 border-white/10 aspect-square bg-zinc-950/60 flex items-center justify-center p-1.5 block group"
      >
        <img
          src={product.image}
          alt={product.name}
          className="transition w-full h-full object-contain group-hover:scale-105 duration-300 rounded-[0.4rem]"
          loading="lazy"
        />
      </Link>

      {/* Card Content Body */}
      <div className="p-2 sm:p-3 flex flex-col h-full flex-1 justify-between">
        <Link href={`/package/${product.slug}`}>
          <p className="text-xs sm:text-sm font-kanit font-bold line-clamp-2 leading-snug mb-2 text-white hover:text-amber-400 transition-colors">
            {product.name}
          </p>
        </Link>

        <div className="mt-auto mb-2.5 flex justify-between items-end">
          <div>
            {product.originalPrice && product.discount ? (
              <div className="flex gap-1.5 items-center mb-0.5">
                <p className="text-[11px] sm:text-xs leading-none line-through text-zinc-500 font-mono">
                  {formatCurrency(product.originalPrice)}
                </p>

                <div className="h-4 sm:h-5 rounded text-[10px] sm:text-xs bg-amber-500/10 px-1 text-amber-400 border border-amber-500/20 inline-flex gap-0.5 items-center whitespace-nowrap font-bold">
                  <TrendingDown className="size-3" />
                  <span>{product.discount}% OFF</span>
                </div>
              </div>
            ) : null}

            <p className="text-sm sm:text-base font-kanit font-extrabold text-white">
              {formatCurrency(product.price)}
            </p>

            <p className="text-[10px] sm:text-xs text-zinc-400">À vista no Pix</p>
          </div>

          {/* CentralCart PIX Badge */}
          <div className="size-6 sm:size-7 bg-[#32bcad26] border border-[#32bcad4d] rounded-md p-1 flex items-center justify-center flex-shrink-0">
            <PixIcon className="w-full h-full text-[#32bcad]" />
          </div>
        </div>

        {/* CentralCart Button */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            type="button"
            onClick={() => onBuyNow(product)}
            className="btn-primary text-xs sm:text-sm h-8 sm:h-9 px-3 w-full rounded sm:rounded-md font-semibold flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Comprar agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
