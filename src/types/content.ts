export interface TrustBadgeItem {
  icon: 'Truck' | 'CreditCard' | 'RotateCcw' | 'ShieldCheck' | 'Sparkles' | 'Clock';
  title: string;
  description: string;
}

export interface StoreSettings {
  id: string;
  announcement_text: string;
  announcement_link?: string;
  free_shipping_threshold: number;
  installments_qty: number;
  installments_interest_free: boolean;
  transfer_discount_percentage: number;
  trust_badges: TrustBadgeItem[];
  updated_at: string;
}

export interface SiteBanner {
  id: string;
  placement: 'hero_slide' | 'collection_banner' | 'middle_promo';
  title: string;
  subtitle?: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DynamicCategoryItem {
  name: string;
  slug: string;
  image: string;
  span?: 'tall' | 'normal' | 'wide';
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'default',
  announcement_text: 'Envío gratis en compras mayores a $25.000 | 3 y 6 Cuotas Sin Interés',
  announcement_link: '/tienda',
  free_shipping_threshold: 25000,
  installments_qty: 6,
  installments_interest_free: true,
  transfer_discount_percentage: 15,
  trust_badges: [
    { icon: 'Truck', title: 'Envío a todo el país', description: 'Llega en 3 a 5 días hábiles' },
    { icon: 'CreditCard', title: 'Financiación accesible', description: '3 y 6 cuotas sin interés' },
    { icon: 'RotateCcw', title: 'Cambio fácil', description: '10 días para cambios sin costo' },
  ],
  updated_at: new Date().toISOString(),
};
