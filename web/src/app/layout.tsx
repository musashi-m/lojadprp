import type { Metadata } from "next";
import { Geist, Kanit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Distrito Paulista RP - Home",
  description: "A Loja Oficial do Distrito Paulista RP. Adquira VIPs, upgrades, personalizações e itens exclusivos.",
  icons: {
    icon: "https://distritopaulista.centralcart.ai/cdn/stores/24490/theme/df72b599-f8f9-4dca-a283-df61d4e0d71a.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${kanit.variable} h-full antialiased dark bg-[#09090b]`}
    >
      <body className="min-h-full flex flex-col font-sans bg-transparent text-[#fafafa] relative">
        {/* Real Distrito Paulista City Wallpaper (Fixed background - High Visibility) */}
        <img
          alt="Distrito Paulista Wallpaper"
          className="fixed object-cover select-none pointer-events-none w-full h-full top-0 left-0 -z-20"
          src="/background.webp"
        />

        {/* Ambient Amber Glow Circles (Identical to CentralCart) */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
          <div className="size-[30rem] rounded-full bg-gradient-to-bl from-amber-500/20 blur-3xl absolute -top-1/3 left-0" />
          <div className="hidden sm:block size-[45rem] rounded-full bg-gradient-to-bl from-amber-500/25 blur-3xl absolute -top-1/3 -right-1/2 sm:right-20" />
        </div>

        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
