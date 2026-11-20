"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { StoreProduct, PRODUCTS_DATA } from "@/data/mockProducts";
import { CartItem, DiscordUser } from "@/types/store";
import { DiscordModal } from "@/components/DiscordModal";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: StoreProduct, quantity?: number) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  couponCode: string;
  discountPercent: number;
  discountAmount: number;
  finalTotal: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string; discountPercent?: number }>;
  removeCoupon: () => void;
  discordUser: DiscordUser | null;
  loginWithDiscord: (returnTo?: string) => Promise<void>;
  logoutDiscord: () => void;
  setDiscordUserDirectly: (user: DiscordUser) => void;
  characterId: string;
  setCharacterId: (id: string) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isDiscordModalOpen: boolean;
  setIsDiscordModalOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [characterId, setCharacterId] = useState("");
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);

  // Load from localStorage or Cookie on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("dprp_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        const defaultProduct = PRODUCTS_DATA.find((p) => p.slug === "30-coins") || PRODUCTS_DATA[0];
        if (defaultProduct) {
          setCart([{ product: defaultProduct, quantity: 1 }]);
        }
      }

      // Always sync cart items with the latest prices from the database
      fetch("/api/products?includeInactive=true")
        .then((res) => res.json())
        .then((data) => {
          if (data.products && Array.isArray(data.products)) {
            setCart((prev) => {
              let hasChange = false;
              const updated = prev.map((item) => {
                const found = data.products.find(
                  (p: StoreProduct) => p.id === item.product.id || p.slug === item.product.slug
                );
                if (found && typeof found.price === "number" && found.price !== item.product.price) {
                  hasChange = true;
                  return { ...item, product: { ...item.product, price: found.price } };
                }
                return item;
              });
              if (hasChange) {
                localStorage.setItem("dprp_cart", JSON.stringify(updated));
              }
              return updated;
            });
          }
        })
        .catch(() => {});

      // Helper to parse Discord user from cookie or localStorage safely
      const parseDiscordData = (raw: string | null) => {
        if (!raw) return null;
        let text = raw;
        try {
          while (text.includes("%7B") || text.includes("%22") || text.includes("%20") || text.includes("%25")) {
            text = decodeURIComponent(text);
          }
          return JSON.parse(text);
        } catch {
          try {
            return JSON.parse(decodeURIComponent(raw));
          } catch {
            try {
              return JSON.parse(raw);
            } catch {
              return null;
            }
          }
        }
      };

      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"));
        return match ? match[2] : null;
      };

      const rawCookie = getCookie("dprp_discord_user");
      const cookieUser = parseDiscordData(rawCookie);
      const rawLocal = localStorage.getItem("dprp_discord_user");
      const localUser = parseDiscordData(rawLocal);

      const resolvedUser = cookieUser || localUser;
      if (resolvedUser) {
        setDiscordUser(resolvedUser);
        localStorage.setItem("dprp_discord_user", JSON.stringify(resolvedUser));
      }

      // Sync directly with /api/auth/discord/me
      fetch("/api/auth/discord/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setDiscordUser(data.user);
            localStorage.setItem("dprp_discord_user", JSON.stringify(data.user));
          }
        })
        .catch(() => {});

      const savedId = localStorage.getItem("dprp_character_id");
      if (savedId) {
        setCharacterId(savedId);
      }
    } catch {
      // fallback
    }
  }, []);

  // Save cart changes
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("dprp_cart", JSON.stringify(newCart));
  };

  const addToCart = (product: StoreProduct, quantity = 1) => {
    const existing = cart.find((item) => item.product.id === product.id);
    let newCart: CartItem[];
    if (existing) {
      newCart = cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { product, quantity }];
    }
    saveCart(newCart);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    saveCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter((item) => item.product.id !== productId);
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string; discountPercent?: number }> => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false, message: "Digite um código de cupom" };

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCouponCode(data.code);
        setDiscountPercent(data.discountPercent);
        return { success: true, message: data.message, discountPercent: data.discountPercent };
      } else {
        setCouponCode("");
        setDiscountPercent(0);
        return { success: false, message: data.message || "Cupom inválido ou expirado" };
      }
    } catch {
      return { success: false, message: "Erro ao validar cupom" };
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscountPercent(0);
  };

  const discountAmount = (subtotal * discountPercent) / 100;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const loginWithDiscord = async (returnTo?: string) => {
    try {
      const res = await fetch("/api/auth/discord/status");
      const data = await res.json();
      if (data.configured) {
        window.location.href = `/api/auth/discord?returnTo=${encodeURIComponent(returnTo || window.location.pathname)}`;
      } else {
        setIsDiscordModalOpen(true);
      }
    } catch {
      setIsDiscordModalOpen(true);
    }
  };

  const setDiscordUserDirectly = (user: DiscordUser) => {
    setDiscordUser(user);
    localStorage.setItem("dprp_discord_user", JSON.stringify(user));
    document.cookie = `dprp_discord_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=2592000; SameSite=Lax`;
  };

  const logoutDiscord = () => {
    setDiscordUser(null);
    localStorage.removeItem("dprp_discord_user");
    document.cookie = "dprp_discord_user=; path=/; max-age=0; SameSite=Lax";
  };

  const handleSetCharacterId = (id: string) => {
    setCharacterId(id);
    localStorage.setItem("dprp_character_id", id);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
        couponCode,
        discountPercent,
        discountAmount,
        finalTotal,
        applyCoupon,
        removeCoupon,
        discordUser,
        loginWithDiscord,
        logoutDiscord,
        setDiscordUserDirectly,
        characterId,
        setCharacterId: handleSetCharacterId,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isDiscordModalOpen,
        setIsDiscordModalOpen,
      }}
    >
      {children}
      <DiscordModal
        isOpen={isDiscordModalOpen}
        onClose={() => setIsDiscordModalOpen(false)}
        onConnect={(user) => setDiscordUserDirectly(user)}
      />
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
