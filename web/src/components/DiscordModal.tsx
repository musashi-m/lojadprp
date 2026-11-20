"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Key, User, ExternalLink, Sparkles } from "lucide-react";
import { DiscordIcon } from "@/components/DiscordIcon";
import { DiscordUser } from "@/types/store";

interface DiscordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (user: DiscordUser) => void;
  returnTo?: string;
}

export const DiscordModal: React.FC<DiscordModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  returnTo = "/checkout",
}) => {
  const [activeTab, setActiveTab] = useState<"quick" | "oauth">("quick");
  const [username, setUsername] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [isCheckingOauth, setIsCheckingOauth] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsCheckingOauth(true);
      fetch("/api/auth/discord/status")
        .then((res) => res.json())
        .then((data) => {
          setOauthConfigured(Boolean(data.configured));
        })
        .catch(() => setOauthConfigured(false))
        .finally(() => setIsCheckingOauth(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim() || "jogador_dprp";
    const cleanId = discordId.trim() || `${Math.floor(100000000000000000 + Math.random() * 900000000000000000)}`;

    const userObj: DiscordUser = {
      id: cleanId,
      username: cleanUser.replace(/^@/, ""),
      globalName: cleanUser.replace(/^@/, ""),
      avatar: "https://distritopaulista.centralcart.ai/cdn/stores/24490/theme/df72b599-f8f9-4dca-a283-df61d4e0d71a.png",
    };

    onConnect(userObj);
    onClose();
  };

  const handleUseDemo = () => {
    const demoUser: DiscordUser = {
      id: "948201938472918471",
      username: "jogador_dprp",
      globalName: "Jogador Distrito",
      avatar: "https://distritopaulista.centralcart.ai/cdn/stores/24490/theme/df72b599-f8f9-4dca-a283-df61d4e0d71a.png",
    };
    onConnect(demoUser);
    onClose();
  };

  const handleRedirectOauth = () => {
    window.location.href = `/api/auth/discord?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0f17] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
              <DiscordIcon className="size-5" />
            </div>
            <div>
              <h3 className="font-kanit font-bold text-base text-white">
                Conectar com Discord
              </h3>
              <p className="text-xs text-zinc-400">
                Vincule sua conta para receber entregas e cargos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mt-4 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("quick")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "quick"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Vincular Manualmente
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("oauth")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "oauth"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span>Login Oficial (OAuth)</span>
            {oauthConfigured && (
              <span className="size-2 rounded-full bg-emerald-500" title="Configurado" />
            )}
          </button>
        </div>

        {/* Tab 1: Manual / Quick */}
        {activeTab === "quick" && (
          <form onSubmit={handleQuickConnect} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Seu Nome de Usuário no Discord
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">@</span>
                <input
                  type="text"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: seunome"
                  className="w-full rounded-xl bg-zinc-950 border border-white/10 ps-8 pe-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#5865F2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Seu Discord ID (Opcional)
              </label>
              <input
                type="text"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                placeholder="ex: 948201938472918471"
                className="w-full rounded-xl bg-zinc-950 border border-white/10 px-3.5 py-2.5 font-mono text-sm text-white placeholder-zinc-600 outline-none focus:border-[#5865F2]"
              />
              <p className="mt-1 text-[10px] text-zinc-500">
                Se deixar em branco, geramos um ID de vínculo automaticamente.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
              <span>Garante a sincronização de cargos e permissões in-game.</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleUseDemo}
                className="rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Conta Demo
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white py-2.5 text-xs font-bold transition-all shadow-lg shadow-[#5865F2]/20"
              >
                Conectar Discord
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: OAuth Configuration */}
        {activeTab === "oauth" && (
          <div className="space-y-4">
            {oauthConfigured ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                  <ShieldCheck className="size-4 shrink-0 mt-0.5" />
                  <span>
                    As credenciais do Discord OAuth estão configuradas! Ao clicar no botão abaixo, você será redirecionado para autorizar diretamente no Discord oficial.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRedirectOauth}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white py-3 px-4 font-bold text-xs shadow-lg transition-all"
                >
                  <DiscordIcon className="size-4" />
                  <span>Autorizar no Discord Oficial</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-zinc-300">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <Key className="size-3.5" />
                    <span>Configuração do Discord OAuth</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Para habilitar o login automático que abre a tela oficial do Discord para todos os jogadores:
                  </p>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-[11px] text-zinc-400 bg-zinc-950 p-3.5 rounded-xl border border-white/5">
                  <li>
                    Acesse o{" "}
                    <a
                      href="https://discord.com/developers/applications"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5865F2] underline inline-flex items-center gap-0.5 font-semibold"
                    >
                      Discord Developer Portal <ExternalLink className="size-2.5" />
                    </a>
                  </li>
                  <li>Selecione sua Aplicação (ou crie uma nova).</li>
                  <li>Vá em <strong>OAuth2 &gt; General</strong>.</li>
                  <li>
                    Adicione em <strong>Redirects</strong>:
                    <div className="mt-1 font-mono text-[10px] bg-black/50 p-1.5 rounded text-amber-300 select-all">
                      http://localhost:3000/api/auth/discord/callback
                    </div>
                  </li>
                  <li>
                    Copie o <strong>Client ID</strong> e o <strong>Client Secret</strong> e adicione no seu arquivo <code className="text-zinc-200">.env.local</code>:
                    <pre className="mt-1 font-mono text-[10px] bg-black/50 p-1.5 rounded text-zinc-300">
{`DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret`}
                    </pre>
                  </li>
                </ol>

                <p className="text-[11px] text-zinc-500 text-center">
                  Enquanto você não configura as chaves, use a aba <strong>Vincular Manualmente</strong> para testar na hora sem impedimentos!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

