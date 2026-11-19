"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { StoreProduct, PRODUCTS_DATA } from "@/data/mockProducts";
import { CartItem, DiscordUser } from "@/types/store";

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
  applyCoupon: (code: string) => { success: boolean; message: string };
  discordUser: DiscordUser | null;
  loginWithDiscord: () => void;
  logoutDiscord: () => void;
  characterId: string;
  setCharacterId: (id: string) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [characterId, setCharacterId] = useState("");
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Load from localStorage on mount (or default to 30 coins as demo)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("dprp_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        // Seed default item if empty so checkout looks like the user's screenshot
        const defaultProduct = PRODUCTS_DATA.find((p) => p.slug === "30-coins") || PRODUCTS_DATA[0];
        if (defaultProduct) {
          setCart([{ product: defaultProduct, quantity: 1 }]);
        }
      }

      const savedDiscord = localStorage.getItem("dprp_discord_user");
      if (savedDiscord) {
        setDiscordUser(JSON.parse(savedDiscord));
      }

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

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false, message: "Digite um código de cupom" };

    if (clean === "DISTRITO10" || clean === "BEMVINDO10") {
      setCouponCode(clean);
      setDiscountPercent(10);
      return { success: true, message: "Cupom de 10% aplicado!" };
    }
    if (clean === "PAULISTA20") {
      setCouponCode(clean);
      setDiscountPercent(20);
      return { success: true, message: "Cupom de 20% aplicado!" };
    }
    return { success: false, message: "Cupom inválido ou expirado" };
  };

  const discountAmount = (subtotal * discountPercent) / 100;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const loginWithDiscord = () => {
    // Simulated instant Discord login
    const mockUser: DiscordUser = {
      id: "948201938472918471",
      username: "jogador_dprp",
      globalName: "Jogador Distrito",
      avatar: "https://distritopaulista.centralcart.ai/cdn/stores/24490/theme/df72b599-f8f9-4dca-a283-df61d4e0d71a.png",
    };
    setDiscordUser(mockUser);
    localStorage.setItem("dprp_discord_user", JSON.stringify(mockUser));
  };

  const logoutDiscord = () => {
    setDiscordUser(null);
    localStorage.removeItem("dprp_discord_user");
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
        discordUser,
        loginWithDiscord,
        logoutDiscord,
        characterId,
        setCharacterId: handleSetCharacterId,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
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

