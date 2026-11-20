"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { STORE_CONFIG } from "@/data/mockProducts";
import { useCart } from "@/context/CartContext";
import {
  ShoppingCart,
  Search,
  Headset,
  ExternalLink,
  User,
  BadgeCheck,
  LogOut,
} from "lucide-react";
import { DiscordIcon } from "@/components/DiscordIcon";

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
  citizenId?: string;
  onOpenCitizenModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery = "",
  onSearchChange,
  onOpenCitizenModal,
}) => {
  const {
    cartCount,
    discordUser,
    loginWithDiscord,
    logoutDiscord,
    characterId,
    setIsCartDrawerOpen,
  } = useCart();

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const supportRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (supportRef.current && !supportRef.current.contains(event.target as Node)) {
        setIsSupportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md py-4 flex items-center border-b border-white/[0.05] bg-[#09090b]/80">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between sm:flex-row relative">
          {/* Left: Brand + Search */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <img
                src={STORE_CONFIG.logoUrl}
                alt={STORE_CONFIG.serverName}
                className="size-11 sm:size-12 rounded-md object-contain"
              />

              <div className="flex items-center gap-1.5">
                <span className="font-kanit font-bold tracking-tight text-white text-base sm:text-lg">
                  {STORE_CONFIG.serverName}
                </span>

                <div className="relative flex items-center justify-center">
                  <BadgeCheck className="size-5 text-blue-500 fill-blue-500" />
                </div>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden md:block relative ms-2 lg:ms-4">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Buscar produto"
                className="transition-all ps-9 pe-4 placeholder:text-zinc-500 border border-white/10 rounded-full h-10 w-[240px] lg:w-[280px] bg-white/5 text-xs text-white outline-none focus:border-amber-400/60"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <ul className="flex gap-2.5 sm:gap-3 items-center text-sm relative z-10">
            {/* Support Dropdown Menu */}
            <li className="relative" ref={supportRef}>
              <button
                onClick={() => setIsSupportOpen(!isSupportOpen)}
                className="w-9 h-9 border border-white/10 font-semibold hover:bg-white/10 transition-colors rounded-[0.6rem] flex items-center justify-center text-zinc-300 hover:text-white"
                title="Canais de Atendimento"
              >
                <Headset className="w-4 h-4" />
                <span className="sr-only">Suporte</span>
              </button>

              {isSupportOpen && (
                <div className="absolute top-12 -right-4 sm:right-0 bg-[#0d0f17] p-3.5 rounded-[0.8rem] border border-white/10 w-64 shadow-2xl z-50 animate-fadeIn">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-white/10">
                    <Headset className="size-4 text-amber-400" />
                    <h3 className="font-kanit font-bold text-sm text-white">
                      Canais de atendimento
                    </h3>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    <a
                      href={STORE_CONFIG.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-xs text-zinc-300 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="size-2 rounded-full bg-pink-500" />
                        <span className="font-medium">Instagram</span>
                      </div>
                      <ExternalLink className="size-3.5 text-zinc-500" />
                    </a>

                    <a
                      href={STORE_CONFIG.socials.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-xs text-zinc-300 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="size-2 rounded-full bg-[#5865F2]" />
                        <span className="font-medium">Discord Oficial</span>
                      </div>
                      <ExternalLink className="size-3.5 text-zinc-500" />
                    </a>

                    <a
                      href={STORE_CONFIG.socials.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-xs text-zinc-300 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span className="font-medium">WhatsApp Suporte</span>
                      </div>
                      <ExternalLink className="size-3.5 text-zinc-500" />
                    </a>
                  </div>
                </div>
              )}
            </li>

            {/* Login / Discord Button (Identical to screenshot) */}
            <li>
              {discordUser ? (
                <div className="flex items-center gap-2 h-9 px-3 border border-[#5865F2]/40 bg-[#5865F2]/10 rounded-[0.6rem] text-xs">
                  <img
                    src={discordUser.avatar || STORE_CONFIG.logoUrl}
                    alt="Discord Avatar"
                    className="size-5 rounded-full"
                  />
                  <span className="font-bold text-white hidden sm:inline truncate max-w-[90px]">
                    {discordUser.globalName || discordUser.username}
                  </span>
                  <button
                    onClick={logoutDiscord}
                    className="text-zinc-400 hover:text-rose-400 ml-1"
                    title="Desconectar Discord"
                  >
                    <LogOut className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => loginWithDiscord()}
                  className="btn-secondary h-9 px-3 sm:px-4 text-xs font-semibold flex items-center gap-2 border-[#5865F2]/40 hover:border-[#5865F2] hover:bg-[#5865F2]/10 text-white transition-all shadow-sm"
                >
                  <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                  <span>Entrar</span>
                </button>
              )}
            </li>

            {/* Cart / Checkout Button (Identical to screenshot) */}
            <li>
              <Link href="/checkout" className="btn-primary h-9 px-4">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Carrinho</span>
                {cartCount > 0 && (
                  <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-950 px-1 font-mono text-[10px] font-bold text-amber-400">
                    {cartCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
