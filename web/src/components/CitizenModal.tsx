"use client";

import React, { useState } from "react";
import { X, User, Check, ShieldCheck } from "lucide-react";

interface CitizenModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCitizenId: string;
  onSave: (id: string) => void;
}

export const CitizenModal: React.FC<CitizenModalProps> = ({
  isOpen,
  onClose,
  currentCitizenId,
  onSave,
}) => {
  const [val, setVal] = useState(currentCitizenId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onSave(val.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/[0.12] bg-[#0d0f17] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Vincular ID</h3>
              <p className="text-[11px] text-zinc-400">Identificador do seu personagem</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Seu ID na Cidade
            </label>
            <input
              type="text"
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Ex: 142"
              className="w-full rounded-xl bg-zinc-950 border border-white/[0.12] px-3.5 py-2.5 font-mono text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-400"
            />
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Informe o ID do seu personagem para a entrega automática dos seus itens.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Entrega vinculada automaticamente à sua conta.</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/[0.05] hover:bg-white/[0.1] py-2 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2 text-xs font-bold transition-all shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]"
            >
              Confirmar ID
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

