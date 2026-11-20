export interface ProductCommand {
  timing: "Após a confirmação" | "Quando expirar" | "Após uma disputa" | string;
  command: string;
}

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  category: 'coins' | 'gemas' | 'vips' | 'especiais' | 'policial' | 'pacotes' | string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  // CentralCart fields
  commands?: (string | ProductCommand)[];
  discordActions?: ProductDiscordAction[];
  cost?: number;
  stock?: boolean;
  minQuantity?: boolean;
  limitPerUser?: boolean;
  quantityLimit?: boolean;
  removeAfter?: string;
}

export interface ProductDiscordAction {
  timing: "Após a confirmação" | "Quando expirar" | "Após uma disputa" | string;
  action: "Adicionar cargo" | "Remover cargo" | "Aplicar banimento" | "Revogar banimento" | string;
  roleId: string;
}

export interface StoreCategory {
  id: string;
  label: string;
  displayOrder?: number;
  createdAt?: string;
  productCount?: number;
}

export const STORE_CONFIG = {
  serverName: "Distrito Paulista RP",
  serverTagline: "A Loja Oficial do Distrito Paulista RP",
  heroDescription: "Adquira VIPs, upgrades, personalizações e itens exclusivos com entrega rápida, pagamento seguro e suporte dedicado. Evolua sua experiência no Distrito Paulista RP com total praticidade.",
  logoUrl: "https://distritopaulista.centralcart.ai/cdn/stores/24490/theme/df72b599-f8f9-4dca-a283-df61d4e0d71a.png",
  bgWallpaperUrl: "/background.png",
  bannerGifUrl: "https://distritopaulista.centralcart.ai/cdn/stores/24490/template_options/8b65fb9a-4b03-4c70-9d29-c445e20bd2ec.gif",
  socials: {
    discord: "https://discord.gg/TZtatFsD9T",
    instagram: "https://www.instagram.com/dpaulistarp/",
    whatsapp: "https://wa.me/5551995931799",
  },
};

export const CATEGORIES_LIST: { id: StoreProduct['category']; label: string }[] = [
  { id: 'coins', label: 'COINS' },
  { id: 'gemas', label: 'GEMAS' },
  { id: 'vips', label: 'VIPS' },
  { id: 'especiais', label: 'ESPECIAIS' },
  { id: 'policial', label: 'POLICIAL' },
  { id: 'pacotes', label: 'PACKS' },
];

export const PRODUCTS_DATA: StoreProduct[] = [
  {
    "id": "pkg-1",
    "slug": "30-coins",
    "name": "30 COINS",
    "category": "coins",
    "price": 29.9,
    "originalPrice": 40.0,
    "discount": 25,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png"
  },
  {
    "id": "pkg-2",
    "slug": "70-coins",
    "name": "70 COINS",
    "category": "coins",
    "price": 69.9,
    "originalPrice": 90.0,
    "discount": 22,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png"
  },
  {
    "id": "pkg-3",
    "slug": "150-coins",
    "name": "150 COINS",
    "category": "coins",
    "price": 149.9,
    "originalPrice": 180.0,
    "discount": 17,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png"
  },
  {
    "id": "pkg-4",
    "slug": "300-coins",
    "name": "300 COINS",
    "category": "coins",
    "price": 299.9,
    "originalPrice": 350.0,
    "discount": 14,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png"
  },
  {
    "id": "pkg-5",
    "slug": "500-coins",
    "name": "500 COINS",
    "category": "coins",
    "price": 499.9,
    "originalPrice": 600.0,
    "discount": 17,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png"
  },
  {
    "id": "pkg-6",
    "slug": "1000-coins",
    "name": "1000 COINS",
    "category": "coins",
    "price": 999.9,
    "originalPrice": 1200.0,
    "discount": 17,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png"
  },
  {
    "id": "pkg-7",
    "slug": "60-gemas",
    "name": "60 GEMAS",
    "category": "gemas",
    "price": 19.9,
    "originalPrice": 29.9,
    "discount": 33,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/b0ddd291-47eb-4635-9e57-de0fd7a87d48.png"
  },
  {
    "id": "pkg-8",
    "slug": "120-gemas",
    "name": "120 GEMAS",
    "category": "gemas",
    "price": 39.9,
    "originalPrice": 60.0,
    "discount": 34,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/b0ddd291-47eb-4635-9e57-de0fd7a87d48.png"
  },
  {
    "id": "pkg-9",
    "slug": "240-gemas",
    "name": "240 GEMAS",
    "category": "gemas",
    "price": 79.9,
    "originalPrice": 100.0,
    "discount": 20,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/b0ddd291-47eb-4635-9e57-de0fd7a87d48.png"
  },
  {
    "id": "pkg-10",
    "slug": "480-gemas",
    "name": "480 GEMAS",
    "category": "gemas",
    "price": 159.9,
    "originalPrice": 200.0,
    "discount": 20,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/b0ddd291-47eb-4635-9e57-de0fd7a87d48.png"
  },
  {
    "id": "pkg-11",
    "slug": "1000-gemas",
    "name": "1000 GEMAS",
    "category": "gemas",
    "price": 329.9,
    "originalPrice": 400.0,
    "discount": 18,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/b0ddd291-47eb-4635-9e57-de0fd7a87d48.png"
  },
  {
    "id": "pkg-12",
    "slug": "unban",
    "name": "UNBAN",
    "category": "especiais",
    "price": 199.9,
    "originalPrice": 699.9,
    "discount": 71,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/24a9d59b-fc30-4725-ba6e-1f31842809ea.png"
  },
  {
    "id": "pkg-13",
    "slug": "sistema-de-som",
    "name": "SISTEMA DE /som",
    "category": "especiais",
    "price": 59.9,
    "originalPrice": 159.9,
    "discount": 63,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/1e40885c-0b6e-4306-b0af-0b4d2a3cd074.png"
  },
  {
    "id": "pkg-14",
    "slug": "tv",
    "name": "TV",
    "category": "especiais",
    "price": 29.9,
    "originalPrice": 159.9,
    "discount": 81,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/52c588be-2615-4f93-8837-68d5e09f0e41.png"
  },
  {
    "id": "pkg-15",
    "slug": "sistema-de-armas",
    "name": "SISTEMA DE ARMAS",
    "category": "especiais",
    "price": 69.9,
    "originalPrice": 159.9,
    "discount": 56,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/3d1e334b-8a33-4b33-a7b0-e6bd6c0c062e.png"
  },
  {
    "id": "pkg-16",
    "slug": "verificado-no-instapic",
    "name": "VERIFICADO NO INSTAPIC",
    "category": "especiais",
    "price": 29.9,
    "originalPrice": 59.9,
    "discount": 50,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/d049ed7c-98ee-497d-aade-896768616026.png"
  },
  {
    "id": "pkg-17",
    "slug": "loja-de-roupas",
    "name": "LOJA DE ROUPAS",
    "category": "especiais",
    "price": 29.9,
    "originalPrice": 60.0,
    "discount": 50,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/ff9753ff-0d90-48f6-af44-17673151000d.png"
  },
  {
    "id": "pkg-18",
    "slug": "loja-de-tatuagem",
    "name": "LOJA DE TATUAGEM",
    "category": "especiais",
    "price": 29.9,
    "originalPrice": 60.0,
    "discount": 50,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/ab651a79-6d39-441f-ba25-af120ea56a97.png"
  },
  {
    "id": "pkg-19",
    "slug": "barbearia",
    "name": "BARBEARIA",
    "category": "especiais",
    "price": 29.9,
    "originalPrice": 60.0,
    "discount": 50,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/7f91ae1f-2ab1-42a4-bd95-d39a041009d3.png"
  },
  {
    "id": "pkg-20",
    "slug": "blipe-de-garagem",
    "name": "BLIPE DE GARAGEM",
    "category": "especiais",
    "price": 29.9,
    "originalPrice": 60.0,
    "discount": 50,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/cc4a3409-8c54-4385-8d31-d053f1cc21b5.png"
  },
  {
    "id": "pkg-21",
    "slug": "prefixo-de-viatura",
    "name": "PREFIXO DE VIATURA",
    "category": "policial",
    "price": 49.9,
    "originalPrice": 499.9,
    "discount": 90,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/0d5c97c8-8c31-4251-84a8-79ff3163a4dc.png"
  },
  {
    "id": "pkg-22",
    "slug": "radio-personalizada-(-policia-)",
    "name": "RADIO PERSONALIZADA ( POLICIA )",
    "category": "policial",
    "price": 14.9,
    "originalPrice": 69.9,
    "discount": 79,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/89e6569b-e559-436a-b64d-cf8ae01a9790.png"
  },
  {
    "id": "pkg-23",
    "slug": "radio-personalizada-(-ilegal-)",
    "name": "RADIO PERSONALIZADA ( ILEGAL )",
    "category": "pacotes",
    "price": 14.9,
    "originalPrice": 69.9,
    "discount": 79,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/6f6f3aaf-38c1-465b-b1ef-96a95480fd17.png"
  },
  {
    "id": "pkg-24",
    "slug": "pack-100k",
    "name": "PACK 100K",
    "category": "pacotes",
    "price": 29.9,
    "originalPrice": 69.9,
    "discount": 57,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/1a2c9560-a07d-4c39-bf54-781add3ceaaf.png"
  },
  {
    "id": "pkg-25",
    "slug": "kit-org",
    "name": "KIT ORG",
    "category": "pacotes",
    "price": 119.9,
    "originalPrice": 140.0,
    "discount": 14,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/f49d5812-cef4-4263-84ca-d78d830ff08c.png"
  },
  {
    "id": "pkg-26",
    "slug": "pack-500k",
    "name": "PACK 500K",
    "category": "pacotes",
    "price": 119.9,
    "originalPrice": 210.0,
    "discount": 43,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/3c0a6147-de7d-4d1f-885e-ee5610ca99ac.png"
  },
  {
    "id": "pkg-27",
    "slug": "pack-1kk",
    "name": "PACK 1KK",
    "category": "pacotes",
    "price": 199.9,
    "originalPrice": 329.9,
    "discount": 39,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/74195a6a-0f4a-4345-91fb-1e7b7a01dcad.png"
  },
  {
    "id": "pkg-28",
    "slug": "vip-policial-(-mensal-)",
    "name": "VIP POLICIAL ( MENSAL )",
    "category": "vips",
    "price": 44.9,
    "originalPrice": 79.9,
    "discount": 44,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/6be38bee-3d89-44b4-a1bc-8ddb62e7f7ab.webp"
  },
  {
    "id": "pkg-29",
    "slug": "vip-policial-(-wipe-)",
    "name": "VIP POLICIAL ( ATE O WIPE )",
    "category": "vips",
    "price": 169.9,
    "originalPrice": 249.9,
    "discount": 32,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/70773582-e355-4579-982c-8ff632bdc882.png"
  },
  {
    "id": "pkg-30",
    "slug": "DMeGpxC-h",
    "name": "VIP MAGNATA (Mensal)",
    "category": "vips",
    "price": 199.9,
    "originalPrice": 300.0,
    "discount": 33,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/a30fe0f6-e6d3-4f3c-a1a4-b6f3acfeba49.png"
  },
  {
    "id": "pkg-31",
    "slug": "vip-magnata-(wipe)",
    "name": "VIP MAGNATA (Wipe)",
    "category": "vips",
    "price": 999.9,
    "originalPrice": 1500.0,
    "discount": 33,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/81d83011-750a-4338-a4b7-37d010dc2e92.png"
  },
  {
    "id": "pkg-32",
    "slug": "vip-distrito-(mensal)",
    "name": "VIP DISTRITO (Mensal)",
    "category": "vips",
    "price": 119.9,
    "originalPrice": 199.9,
    "discount": 40,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/d0206ac3-840a-4b3c-9e7d-7ecddbbfbb7e.png"
  },
  {
    "id": "pkg-33",
    "slug": "vip-distrito-(wipe)",
    "name": "VIP DISTRITO (Wipe)",
    "category": "vips",
    "price": 449.9,
    "originalPrice": 520.0,
    "discount": 13,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/22cd5904-70d4-45f4-acf9-f1c0dd675400.png"
  },
  {
    "id": "pkg-34",
    "slug": "vip-paulista-(mensal)",
    "name": "VIP PAULISTA (Mensal)",
    "category": "vips",
    "price": 69.9,
    "originalPrice": 100.0,
    "discount": 30,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/c27c6301-cf79-4f12-92a8-8982ad25951c.png"
  },
  {
    "id": "pkg-35",
    "slug": "vip-paulista-(wipe)",
    "name": "VIP PAULISTA (Wipe)",
    "category": "vips",
    "price": 329.9,
    "originalPrice": 400.0,
    "discount": 18,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/1e5a3867-2bfe-46aa-9aca-0d6310bcaa2d.png"
  },
  {
    "id": "pkg-36",
    "slug": "vip-turista-(mensal)",
    "name": "VIP TURISTA (Mensal)",
    "category": "vips",
    "price": 39.9,
    "originalPrice": 75.0,
    "discount": 47,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/9acbea0a-2ca0-4d61-9512-8682086fb0b5.png"
  },
  {
    "id": "pkg-37",
    "slug": "vip-turista-(wipe)",
    "name": "VIP TURISTA (Wipe)",
    "category": "vips",
    "price": 169.9,
    "originalPrice": 200.0,
    "discount": 15,
    "image": "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/6e7a8861-6799-41b0-87c1-7074593f4a19.png"
  }
];

export function getProductBySlug(slug: string): StoreProduct | undefined {
  const decoded = decodeURIComponent(slug);
  return PRODUCTS_DATA.find((p) => p.slug === decoded || p.slug === slug || p.id === slug);
}

export function getProductDescription(product: {
  category?: string;
  slug?: string;
  name?: string;
}): {
  overview: string;
  sections?: { title: string; content: string[] | string }[];
} {
  const cat = (product.category || "").toLowerCase();
  const slug = (product.slug || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  // 1. COINS
  if (cat === "coins") {
    return {
      overview: "As Coins são a moeda premium exclusiva da Distrito Paulista.",
      sections: [
        {
          title: "COMO OBTER",
          content: "As Coins podem ser adquiridas exclusivamente através da Loja Oficial.",
        },
        {
          title: "PARA QUE SERVEM?",
          content: [
            "Mansões e imóveis exclusivos;",
            "Veículos exclusivos;",
            "Benefícios premium;",
            "Conteúdos especiais;",
            "Futuras novidades disponibilizadas pela cidade.",
          ],
        },
        {
          title: "CONSULTAR SALDO",
          content: "Para consultar sua quantidade de Coins, utilize o comando: /moeda",
        },
      ],
    };
  }

  // 2. GEMAS
  if (cat === "gemas") {
    return {
      overview: "As Gemas são utilizadas para giros de roleta da sorte, caixas misteriosas e itens cosméticos exclusivos.",
      sections: [
        {
          title: "COMO UTILIZAR",
          content: "Após a aprovação do pagamento, as gemas serão creditadas diretamente no menu do seu personagem.",
        },
        {
          title: "REGRA DE USO",
          content: [
            "Não reembolsável após o uso em caixas ou roletas;",
            "Válido para todos os personagens da sua conta;",
            "Sem prazo de expiração.",
          ],
        },
      ],
    };
  }

  // 3. VIPS
  if (cat === "vips") {
    let vipOverview = "Plano VIP de prestígio no Distrito Paulista com vantagens em economia, slots e prioridade.";
    if (name.includes("turista") || slug.includes("turista")) {
      vipOverview = "Plano VIP Turista — A porta de entrada ideal para novos moradores com vantagens essenciais e bônus de salário.";
    } else if (name.includes("paulista") || slug.includes("paulista")) {
      vipOverview = "Plano VIP Paulista — Nível intermediário completo com slots extras de roupas, bônus de rendimento e vantagens especiais.";
    } else if (name.includes("distrito") || slug.includes("distrito")) {
      vipOverview = "Plano VIP Distrito — Nível avançado com alta prioridade na fila da cidade, verificado oficial e grandes bônus de rendimentos.";
    } else if (name.includes("magnata") || slug.includes("magnata")) {
      vipOverview = "Plano VIP Magnata — O nível máximo de prestígio e autoridade com todas as vantagens e regalias liberadas no servidor.";
    } else if (name.includes("policial") || slug.includes("policial")) {
      vipOverview = "Plano VIP Policial — Desenvolvido exclusivamente para membros da polícia militar e civil com vantagens na carreira.";
    }

    return {
      overview: vipOverview,
      sections: [
        {
          title: "BENEFÍCIOS PRINCIPAIS",
          content: [
            "+1 Slot de Roupa — Aumenta o limite de roupas que podem ser salvas no armário.",
            "Bônus de Salário — Receba adicionais a cada 30 minutos logado na cidade.",
            "Gemas de Brinde — Receba gemas ao adquirir o plano.",
            "Verificado no Instapick — Receba o selo oficial de verificação.",
            "Consumíveis mais rápidos — Reduz o tempo de animação de itens consumíveis.",
            "Bônus nos Empregos — Ganhos adicionais em todas as atividades civis e legais.",
          ],
        },
        {
          title: "IMPORTANTE",
          content: "Para que todos os benefícios sejam ativados corretamente, basta relogar na cidade após a compra do VIP. O bônus de salário será disponibilizado após completar o tempo mínimo dentro da cidade sem deslogar.",
        },
      ],
    };
  }

  // 4. POLICIAL
  if (cat === "policial") {
    return {
      overview: "Item e personalização oficial da corporação policial do Distrito Paulista RP.",
      sections: [
        {
          title: "INSTRUÇÕES & REGRAS",
          content: [
            "Exclusivo para membros devidamente recrutados e na ativa da corporação;",
            "Liberação de prefixo ou rádio mediante autorização do comando geral;",
            "Entrega automática com registro no sistema da corregedoria.",
          ],
        },
      ],
    };
  }

  // 5. PACOTES (PACKS)
  if (cat === "pacotes") {
    if (name.includes("100k") || name.includes("500k") || name.includes("1kk") || slug.includes("pack")) {
      return {
        overview: "Pacote de economia oficial para impulsionar seu personagem no Distrito Paulista RP.",
        sections: [
          {
            title: "INFORMAÇÕES DO PACOTE",
            content: [
              "Dinheiro limpo creditado diretamente na conta bancária do personagem;",
              "Sem risco de roubo ou perda no ato da entrega;",
              "Entrega automática e instantânea logo após confirmação do PIX.",
            ],
          },
        ],
      };
    }
    if (name.includes("kit") || slug.includes("kit")) {
      return {
        overview: "Kit de suprimentos e equipamentos essenciais para criação e manutenção de organizações.",
        sections: [
          {
            title: "CONTEÚDO DO KIT",
            content: [
              "Suprimentos básicos para membros e liderança da facção/organização;",
              "Liberação no painel da organização na cidade;",
              "Suporte da equipe de administração para alinhamento territorial.",
            ],
          },
        ],
      };
    }
  }

  // 6. ESPECIAIS
  if (cat === "especiais") {
    if (slug.includes("unban") || name.includes("unban")) {
      return {
        overview: "Pacote oficial de desbanimento e revisão de punição no Distrito Paulista RP.",
        sections: [
          {
            title: "REGRAS DO UNBAN",
            content: [
              "Válido apenas para banimentos comunitários e punições passíveis de revisão;",
              "Banimentos por uso de trapaças / softwares de terceiros (cheats) NÃO são passíveis de unban;",
              "Liberação automática na whitelist do servidor após a confirmação.",
            ],
          },
        ],
      };
    }
    if (slug.includes("som") || name.includes("som")) {
      return {
        overview: "Acesso permanente ao comando /som no veículo ou ambiente do Distrito Paulista RP.",
        sections: [
          {
            title: "FUNCIONALIDADES",
            content: [
              "Permite reproduzir músicas do YouTube ou links de áudio diretos;",
              "Controle de volume espacial 3D em tempo real;",
              "Funciona em qualquer veículo que você estiver conduzindo.",
            ],
          },
        ],
      };
    }
    if (slug.includes("tv") || name.includes("tv")) {
      return {
        overview: "Acesso ao sistema de TV e transmissão multimídia em residências e propriedades.",
        sections: [
          {
            title: "COMO UTILIZAR",
            content: [
              "Interaja com o televisor de qualquer imóvel próprio ou alugado;",
              "Compatível com transmissões ao vivo e vídeos via web.",
            ],
          },
        ],
      };
    }
    if (slug.includes("instapic") || name.includes("instapic")) {
      return {
        overview: "Selo azul de verificado oficial em seu perfil do Instapic no celular in-game.",
        sections: [
          {
            title: "BENEFÍCIOS",
            content: [
              "Destaque em postagens e perfil verificado visível para todos os cidadãos;",
              "Proteção contra contas fakes ou imitadores na rede social da cidade.",
            ],
          },
        ],
      };
    }
  }

  // DEFAULT
  return {
    overview: `Item oficial da categoria ${(product.category || "loja").toUpperCase()} do Distrito Paulista RP.`,
    sections: [
      {
        title: "INSTRUÇÕES DE ENTREGA",
        content: [
          "Informe o seu ID da cidade no momento da compra.",
          "Entrega instantânea em até 30 segundos após aprovação do PIX.",
          "Suporte via ticket no Discord oficial da cidade.",
        ],
      },
    ],
  };
}

export function formatProductDescriptionText(product: {
  category?: string;
  slug?: string;
  name?: string;
  description?: string;
}): string {
  if (product.description && product.description.trim()) {
    return product.description;
  }
  const desc = getProductDescription(product);
  let text = desc.overview;
  if (desc.sections && desc.sections.length > 0) {
    for (const sec of desc.sections) {
      text += `\n\n${sec.title}\n`;
      if (Array.isArray(sec.content)) {
        text += sec.content.map((c) => `• ${c}`).join("\n");
      } else {
        text += sec.content;
      }
    }
  }
  return text;
}

export function getDefaultProductCommands(product: {
  category?: string;
  slug?: string;
  name?: string;
}): ProductCommand[] {
  const cat = (product.category || "").toLowerCase();
  const slug = (product.slug || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  // 1. Coins: addcoin [citizenid] [qtde]
  if (cat === "coins") {
    const num = slug.replace(/\D/g, "") || "30";
    return [{ timing: "Após a confirmação", command: `addcoin {client_identifier} ${num}` }];
  }

  // 2. Gemas: addgema [citizenid] [qtde]
  if (cat === "gemas") {
    const num = slug.replace(/\D/g, "") || "60";
    return [{ timing: "Após a confirmação", command: `addgema {client_identifier} ${num}` }];
  }

  // 3. VIPs: setvip [citizenid] [tipo] [dias] & removevip [citizenid] ao expirar
  if (cat === "vips") {
    let vipType = "turista";
    if (name.includes("paulista") || slug.includes("paulista")) vipType = "paulista";
    else if (name.includes("distrito") || slug.includes("distrito")) vipType = "distrito";
    else if (name.includes("magnata") || slug.includes("magnata")) vipType = "magnata";
    else if (name.includes("policial") || slug.includes("policial")) vipType = "policial";

    const isWipe = name.includes("wipe") || slug.includes("wipe");
    const days = isWipe ? 0 : 30;

    const cmds = [
      { timing: "Após a confirmação", command: `setvip {client_identifier} ${vipType} ${days}` },
    ];

    // Bônus em gemas dos planos VIP (conforme CentralCart)
    if (vipType === "magnata") {
      cmds.push({ timing: "Após a confirmação", command: `addgema {client_identifier} 500` });
    } else if (vipType === "distrito") {
      cmds.push({ timing: "Após a confirmação", command: `addgema {client_identifier} 250` });
    } else if (vipType === "paulista") {
      cmds.push({ timing: "Após a confirmação", command: `addgema {client_identifier} 125` });
    } else if (vipType === "turista") {
      cmds.push({ timing: "Após a confirmação", command: `addgema {client_identifier} 60` });
    }

    // Remoção automática ao expirar
    if (!isWipe) {
      cmds.push({ timing: "Quando expirar", command: `removevip {client_identifier}` });
    }

    return cmds;
  }

  // 4. Som: addsom [citizenid]
  if (slug.includes("som") || name.includes("/som") || name.includes("som")) {
    return [{ timing: "Após a confirmação", command: `addsom {client_identifier}` }];
  }

  // 5. Armas: addarmas [citizenid]
  if (slug.includes("armas") || name.includes("armas")) {
    return [{ timing: "Após a confirmação", command: `addarmas {client_identifier}` }];
  }

  // 6. Packs de dinheiro / Itens: item2 [citizenid] [item] [qtde]
  if (slug.includes("100k") || name.includes("100k")) {
    return [{ timing: "Após a confirmação", command: `item2 {client_identifier} money 100000` }];
  }
  if (slug.includes("500k") || name.includes("500k")) {
    return [{ timing: "Após a confirmação", command: `item2 {client_identifier} money 500000` }];
  }
  if (slug.includes("1kk") || name.includes("1kk")) {
    return [{ timing: "Após a confirmação", command: `item2 {client_identifier} money 1000000` }];
  }

  // 7. Unban
  if (slug.includes("unban") || name.includes("unban")) {
    return [{ timing: "Após a confirmação", command: `unban {client_identifier}` }];
  }

  return [{ timing: "Após a confirmação", command: `item2 {client_identifier} item_padrao 1` }];
}
