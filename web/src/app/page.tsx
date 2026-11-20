"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import {
  CATEGORIES_LIST,
  PRODUCTS_DATA,
  StoreProduct,
} from "@/data/mockProducts";
import { Menu, ChevronRight, X, Layers, AlertCircle } from "lucide-react";

export default function DistritoPaulistaStore() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [categories, setCategories] = useState<{ id: string; label: string }[]>(CATEGORIES_LIST);
  const [products, setProducts] = useState<StoreProduct[]>(PRODUCTS_DATA);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);

  useEffect(() => {
    async function loadDynamicCatalog() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products")
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.categories && catData.categories.length > 0) {
            setCategories(catData.categories);
          }
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.products && prodData.products.length > 0) {
            setProducts(prodData.products);
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar catálogo dinâmico:", err);
      }
    }
    loadDynamicCatalog();
  }, []);

  const handleBuyNow = (product: StoreProduct) => {
    addToCart(product);
    router.push("/checkout");
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === "all" ? true : p.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen text-[#fafafa] flex flex-col font-sans bg-transparent">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <HeroBanner />

      <main className="flex-1">
        <section
          id="store"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-4 scroll-m-24 xl:grid xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-8"
        >
          {/* Mobile Category Toggle Button */}
          <div className="xl:hidden mb-6">
            <button
              type="button"
              onClick={() => setIsMobileCategoryOpen(true)}
              className="btn-secondary h-11 w-full justify-between bg-black/40 backdrop-blur-sm border border-white/10 px-4"
            >
              <span className="flex items-center gap-2">
                <Menu className="size-4 shrink-0 text-amber-400" />
                <span className="font-kanit font-bold">
                  Categorias:{" "}
                  {activeCategory === "all"
                    ? "Todas as Categorias"
                    : categories.find((c) => c.id === activeCategory)?.label || activeCategory.toUpperCase()}
                </span>
              </span>
              <ChevronRight className="size-4 text-zinc-400" />
            </button>
          </div>

          {/* Desktop Sidebar: Categories */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#0d0f17]/80 backdrop-blur-md p-4">
              <h4 className="font-kanit font-bold text-base text-white px-3 py-2 border-b border-white/10 mb-2 flex items-center gap-2">
                <Layers className="size-4 text-amber-400" />
                <span>Categorias</span>
              </h4>

              <nav className="space-y-1">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-kanit font-bold text-sm transition-all text-left ${
                    activeCategory === "all"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>TODAS AS CATEGORIAS</span>
                  <span className="text-xs font-mono opacity-70">
                    {products.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = products.filter(
                    (p) => p.category === cat.id
                  ).length;
                  const isActive = activeCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-kanit font-bold text-sm transition-all text-left ${
                        isActive
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-xs font-mono opacity-70">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right Main Column: Category Header Badge & Package Grid */}
          <div className="space-y-8">
            {activeCategory === "all" && searchQuery === "" ? (
              categories.map((cat) => {
                const categoryProducts = products.filter(
                  (p) => p.category === cat.id
                );
                if (categoryProducts.length === 0) return null;

                return (
                  <div key={cat.id} className="min-h-[200px]">
                    <h3 className="bg-amber-500/15 border-2 border-amber-500/80 w-fit py-1.5 px-4 rounded-[0.6rem] text-sm sm:text-base font-kanit font-bold backdrop-blur-sm text-white mb-4 tracking-wider">
                      {cat.label}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 package-list">
                      {categoryProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onBuyNow={handleBuyNow}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="bg-amber-500/15 border-2 border-amber-500/80 w-fit py-1.5 px-4 rounded-[0.6rem] text-sm sm:text-base font-kanit font-bold backdrop-blur-sm text-white tracking-wider">
                    {searchQuery
                      ? `BUSCA: "${searchQuery}"`
                      : categories.find((c) => c.id === activeCategory)?.label ||
                        activeCategory.toUpperCase()}
                  </h3>

                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-amber-400 hover:underline font-mono"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#0d0f17]/50 p-12 text-center backdrop-blur-sm">
                    <AlertCircle className="size-10 text-amber-400 mx-auto mb-3 opacity-60" />
                    <p className="font-kanit text-lg font-bold text-white mb-1">
                      Nenhum pacote encontrado
                    </p>
                    <p className="text-sm text-zinc-400">
                      Tente buscar por outro termo ou selecione outra categoria.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 package-list">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onBuyNow={handleBuyNow}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Mobile Drawer */}
      {isMobileCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/70 backdrop-blur-sm">
          <div className="flex h-full w-[85vw] max-w-sm flex-col border-r border-white/10 bg-[#09090b] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h4 className="font-kanit text-lg font-bold text-white">Categorias</h4>
              <button
                type="button"
                onClick={() => setIsMobileCategoryOpen(false)}
              >
                <X className="size-5 text-zinc-400 hover:text-white" />
              </button>
            </div>

            <nav className="space-y-1 overflow-y-auto">
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setIsMobileCategoryOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg font-kanit font-bold text-sm ${
                  activeCategory === "all"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>TODAS AS CATEGORIAS</span>
                <span className="text-xs font-mono">{products.length}</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setIsMobileCategoryOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg font-kanit font-bold text-sm ${
                    activeCategory === cat.id
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-xs font-mono">
                    {products.filter((p) => p.category === cat.id).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
