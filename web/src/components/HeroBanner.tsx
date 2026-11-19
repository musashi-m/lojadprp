"use client";

import React from "react";
import { STORE_CONFIG } from "@/data/mockProducts";
import { ArrowRight, Phone, MessageSquare } from "lucide-react";

export const HeroBanner: React.FC = () => {
  return (
    <section className="space-y-6 pt-6 pb-4">
      {/* Central Animated Store Banner GIF */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <img
            src={STORE_CONFIG.bannerGifUrl}
            alt="Distrito Paulista Banner"
            className="w-full object-cover pointer-events-none select-none max-h-[380px]"
          />
        </div>
      </div>

      {/* Hero Headline & CTA (Identical text and style to CentralCart) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-kanit text-3xl sm:text-5xl lg:text-6xl lg:max-w-3xl font-extrabold tracking-tight text-white mb-4">
            {STORE_CONFIG.serverTagline}
          </h1>

          <p className="max-w-[620px] text-zinc-400 text-sm sm:text-base leading-relaxed mb-8">
            {STORE_CONFIG.heroDescription}
          </p>

          <div className="flex gap-3 items-center text-sm">
            <a href="#store" className="btn-primary h-10 px-5 text-sm">
              <span>Ver produtos</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={STORE_CONFIG.socials.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary h-10 px-5 text-sm"
            >
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <span>Contato</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
