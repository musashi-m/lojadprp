"use client";

import React from "react";
import { STORE_CONFIG } from "@/data/mockProducts";
import { ShieldCheck, Zap } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#09090b]/80 backdrop-blur-md z-10 relative overflow-hidden border-t border-white/10 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center flex-wrap gap-6">
          <div>
            <a href="/" className="w-fit flex items-center gap-3">
              <img
                src={STORE_CONFIG.logoUrl}
                alt={STORE_CONFIG.serverName}
                className="w-12 h-12 object-contain"
              />
              <h1 className="font-kanit text-lg font-bold text-white">
                {STORE_CONFIG.serverName}
              </h1>
            </a>

            <div className="mt-3 mb-4 space-y-1 text-sm text-zinc-400">
              <p>
                CNPJ: <span className="text-zinc-200 font-semibold">55.967.799/0001-81 - RICARDO SIDNEI BRAUN FILHO</span>
              </p>
              <p className="text-xs text-zinc-500">
                Aviso: Não possuímos vínculo com a Rockstar Games ou Take-Two Interactive.
              </p>
            </div>

            <p className="text-zinc-500 text-xs flex items-center gap-1.5">
              <span>Loja Oficial Distrito Paulista RP • Entrega Automática</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3.5 py-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <div>
                <div className="font-bold text-zinc-200">PIX Instantâneo</div>
                <div className="text-[10px] text-zinc-500">Aprovação em 30s</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3.5 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="font-bold text-zinc-200">Segurança Total</div>
                <div className="text-[10px] text-zinc-500">Zero taxas de terceiros</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
