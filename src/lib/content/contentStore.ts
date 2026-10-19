import { StoreSettings, SiteBanner, DynamicCategoryItem, DEFAULT_STORE_SETTINGS } from '@/types/content';
import { createClient } from '@/lib/supabase/client';

// In-memory fallback cache for offline test runners and when Supabase is not connected
let memoryStoreSettings: StoreSettings = {
  ...DEFAULT_STORE_SETTINGS,
  trust_badges: DEFAULT_STORE_SETTINGS.trust_badges.map((b) => ({ ...b })),
};
const memoryBanners: Map<string, SiteBanner> = new Map([
  [
    '00000000-0000-4000-8000-000000000001',
    {
      id: '00000000-0000-4000-8000-000000000001',
      placement: 'hero_slide',
      title: 'Nueva Colección 2026',
      subtitle: 'Diseño consciente, texturas nobles y elegancia cotidiana',
      cta_text: 'Explorar Catálogo',
      cta_link: '/tienda',
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&h=900&fit=crop&q=80',
      order_index: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  [
    '00000000-0000-4000-8000-000000000002',
    {
      id: '00000000-0000-4000-8000-000000000002',
      placement: 'collection_banner',
      title: 'Colección Otoño 2026',
      subtitle: 'Texturas naturales, siluetas fluidas y una paleta que abraza la tierra.',
      cta_text: 'Descubrir',
      cta_link: '/tienda',
      image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=700&fit=crop&q=75',
      order_index: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
]);

function getSupabaseClient(customClient?: any) {
  if (customClient) return customClient;
  try {
    return createClient();
  } catch {
    return null;
  }
}

/**
 * Obtiene la configuración global de la tienda (anuncios, cuotas, trust badges, umbral envío)
 */
export async function getStoreSettings(customClient?: any): Promise<StoreSettings> {
  const client = getSupabaseClient(customClient);
  if (client) {
    try {
      const { data, error } = await client
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        const settings: StoreSettings = {
          id: data.id || 'default',
          announcement_text: data.announcement_text ?? memoryStoreSettings.announcement_text,
          announcement_link: data.announcement_link ?? memoryStoreSettings.announcement_link,
          free_shipping_threshold: Number(data.free_shipping_threshold ?? memoryStoreSettings.free_shipping_threshold),
          installments_qty: Number(data.installments_qty ?? memoryStoreSettings.installments_qty),
          installments_interest_free: Boolean(data.installments_interest_free ?? memoryStoreSettings.installments_interest_free),
          transfer_discount_percentage: Number(data.transfer_discount_percentage ?? memoryStoreSettings.transfer_discount_percentage),
          trust_badges: Array.isArray(data.trust_badges)
            ? data.trust_badges.map((b: any) => ({ ...b }))
            : memoryStoreSettings.trust_badges.map((b) => ({ ...b })),
          updated_at: data.updated_at || new Date().toISOString(),
        };
        memoryStoreSettings = { ...settings };
        return {
          ...settings,
          trust_badges: settings.trust_badges.map((b) => ({ ...b })),
        };
      }
    } catch {
      // Fallback a memoria
    }
  }
  return {
    ...memoryStoreSettings,
    trust_badges: memoryStoreSettings.trust_badges.map((b) => ({ ...b })),
  };
}

/**
 * Actualiza la configuración global de la tienda
 */
export async function updateStoreSettings(
  updates: Partial<StoreSettings>,
  customClient?: any
): Promise<StoreSettings> {
  const now = new Date().toISOString();
  const merged: StoreSettings = {
    ...memoryStoreSettings,
    ...updates,
    id: 'default',
    updated_at: now,
  };
  memoryStoreSettings = { ...merged };

  const client = getSupabaseClient(customClient);
  if (client) {
    try {
      const { data, error } = await client
        .from('store_settings')
        .upsert(
          {
            id: 'default',
            announcement_text: merged.announcement_text,
            announcement_link: merged.announcement_link,
            free_shipping_threshold: merged.free_shipping_threshold,
            installments_qty: merged.installments_qty,
            installments_interest_free: merged.installments_interest_free,
            transfer_discount_percentage: merged.transfer_discount_percentage,
            trust_badges: merged.trust_badges,
            updated_at: now,
          },
          { onConflict: 'id' }
        )
        .select()
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          announcement_text: data.announcement_text,
          announcement_link: data.announcement_link,
          free_shipping_threshold: Number(data.free_shipping_threshold),
          installments_qty: Number(data.installments_qty),
          installments_interest_free: Boolean(data.installments_interest_free),
          transfer_discount_percentage: Number(data.transfer_discount_percentage),
          trust_badges: data.trust_badges,
          updated_at: data.updated_at,
        };
      }
    } catch {
      // Retorna el valor en memoria actualizado
    }
  }

  return merged;
}

/**
 * Obtiene los banners de la tienda, opcionalmente filtrados por ubicación ('hero_slide', 'collection_banner', 'middle_promo')
 */
export async function getSiteBanners(
  placement?: SiteBanner['placement'],
  customClient?: any
): Promise<SiteBanner[]> {
  const client = getSupabaseClient(customClient);
  if (client) {
    try {
      let query = client
        .from('site_banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (placement) {
        query = query.eq('placement', placement);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data.map((b: any) => ({
          id: b.id,
          placement: b.placement,
          title: b.title,
          subtitle: b.subtitle,
          cta_text: b.cta_text,
          cta_link: b.cta_link,
          image_url: b.image_url,
          order_index: Number(b.order_index ?? 0),
          is_active: Boolean(b.is_active ?? true),
          created_at: b.created_at,
          updated_at: b.updated_at,
        }));
      }
    } catch {
      // Fallback a memoria
    }
  }

  let list = Array.from(memoryBanners.values());
  if (placement) {
    list = list.filter((b) => b.placement === placement);
  }
  return list.sort((a, b) => a.order_index - b.order_index);
}

/**
 * Crea un nuevo banner
 */
export async function createSiteBanner(
  banner: Omit<SiteBanner, 'id' | 'created_at' | 'updated_at'> & { id?: string },
  customClient?: any
): Promise<SiteBanner> {
  const id = banner.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const newBanner: SiteBanner = {
    ...banner,
    id,
    order_index: banner.order_index ?? 0,
    is_active: banner.is_active ?? true,
    created_at: now,
    updated_at: now,
  };

  memoryBanners.set(id, newBanner);

  const client = getSupabaseClient(customClient);
  if (client) {
    try {
      const { data, error } = await client
        .from('site_banners')
        .insert({
          id,
          placement: newBanner.placement,
          title: newBanner.title,
          subtitle: newBanner.subtitle,
          cta_text: newBanner.cta_text,
          cta_link: newBanner.cta_link,
          image_url: newBanner.image_url,
          order_index: newBanner.order_index,
          is_active: newBanner.is_active,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          placement: data.placement,
          title: data.title,
          subtitle: data.subtitle,
          cta_text: data.cta_text,
          cta_link: data.cta_link,
          image_url: data.image_url,
          order_index: Number(data.order_index),
          is_active: Boolean(data.is_active),
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch {
      // Retorna banner en memoria
    }
  }

  return newBanner;
}

/**
 * Actualiza un banner existente
 */
export async function updateSiteBanner(
  id: string,
  updates: Partial<SiteBanner>,
  customClient?: any
): Promise<SiteBanner | null> {
  const existing = memoryBanners.get(id);
  const now = new Date().toISOString();
  if (existing) {
    const updated: SiteBanner = {
      ...existing,
      ...updates,
      id,
      updated_at: now,
    };
    memoryBanners.set(id, updated);
  }

  const client = getSupabaseClient(customClient);
  if (client) {
    try {
      const { data, error } = await client
        .from('site_banners')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error && data) {
        const mapped: SiteBanner = {
          id: data.id,
          placement: data.placement,
          title: data.title,
          subtitle: data.subtitle,
          cta_text: data.cta_text,
          cta_link: data.cta_link,
          image_url: data.image_url,
          order_index: Number(data.order_index),
          is_active: Boolean(data.is_active),
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        memoryBanners.set(id, mapped);
        return mapped;
      }
    } catch {
      // Ignorar error de red
    }
  }

  return memoryBanners.get(id) || null;
}

/**
 * Elimina un banner por ID
 */
export async function deleteSiteBanner(id: string, customClient?: any): Promise<boolean> {
  memoryBanners.delete(id);

  const client = getSupabaseClient(customClient);
  if (client) {
    try {
      const { error } = await client.from('site_banners').delete().eq('id', id);
      return !error;
    } catch {
      return true;
    }
  }
  return true;
}

/**
 * Obtiene categorías dinámicas para la sección Bento combinando collections de Supabase o fallback predefinido
 */
export async function getDynamicCategories(customClient?: any): Promise<DynamicCategoryItem[]> {
  const client = getSupabaseClient(customClient);
  if (client) {
    try {
      const { data: collections, error } = await client
        .from('collections')
        .select('id, name, slug, image_url')
        .order('name');

      if (!error && Array.isArray(collections) && collections.length > 0) {
        const spans: ('tall' | 'normal' | 'wide')[] = ['tall', 'normal', 'normal', 'wide'];
        return collections.slice(0, 4).map((c: any, index: number) => ({
          name: c.name,
          slug: `/tienda?collection=${c.slug || c.id}`,
          image: c.image_url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&q=75',
          span: spans[index % spans.length],
        }));
      }
    } catch {
      // fallback
    }
  }

  return [
    {
      name: 'Vestidos',
      slug: '/tienda?cat=Vestidos',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&q=75',
      span: 'tall',
    },
    {
      name: 'Colección Italiana',
      slug: '/tienda?collection=italiana',
      image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&h=600&fit=crop&q=75',
      span: 'normal',
    },
    {
      name: 'Pantalones',
      slug: '/tienda?cat=Pantalones',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop&q=75',
      span: 'normal',
    },
    {
      name: 'Accesorios',
      slug: '/tienda?cat=Accesorios',
      image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&h=800&fit=crop&q=75',
      span: 'wide',
    },
  ];
}

/**
 * Repositorio de Contenido para inyección de dependencias y pruebas unitarias
 */
export interface ContentRepository {
  getStoreSettings(): Promise<StoreSettings>;
  updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings>;
  getSiteBanners(placement?: SiteBanner['placement']): Promise<SiteBanner[]>;
  createSiteBanner(banner: Omit<SiteBanner, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<SiteBanner>;
  updateSiteBanner(id: string, updates: Partial<SiteBanner>): Promise<SiteBanner | null>;
  deleteSiteBanner(id: string): Promise<boolean>;
  getDynamicCategories(): Promise<DynamicCategoryItem[]>;
}

export function createContentRepository(customClient?: any): ContentRepository {
  return {
    getStoreSettings: () => getStoreSettings(customClient),
    updateStoreSettings: (settings) => updateStoreSettings(settings, customClient),
    getSiteBanners: (placement) => getSiteBanners(placement, customClient),
    createSiteBanner: (banner) => createSiteBanner(banner, customClient),
    updateSiteBanner: (id, updates) => updateSiteBanner(id, updates, customClient),
    deleteSiteBanner: (id) => deleteSiteBanner(id, customClient),
    getDynamicCategories: () => getDynamicCategories(customClient),
  };
}
