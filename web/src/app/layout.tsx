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
        {/* Real Distrito Paulista City Wallpaper (Fixed background - Pristine High Quality) */}
        <div className="fixed inset-0 -z-20 pointer-events-none select-none overflow-hidden">
          <img
            alt="Distrito Paulista Wallpaper"
            className="w-full h-full object-cover object-center"
            src="/background.png"
          />
        </div>

        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
