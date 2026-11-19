import { StoreProduct } from "@/data/mockProducts";

export type ProductCategory = 'todos' | 'coins' | 'gemas' | 'vips' | 'especiais' | 'policial' | 'pacotes';

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export interface DiscordUser {
  id: string; // e.g. "829103918291029384"
  username: string; // e.g. "lucas_rp"
  globalName?: string; // e.g. "Lucas Corleone"
  avatar?: string;
}

export interface CheckoutFormData {
  fullName: string;
  email: string;
  cpf: string;
  characterId: string;
  paymentMethod: 'pix' | 'mercadopago';
  acceptedTerms: boolean;
}
