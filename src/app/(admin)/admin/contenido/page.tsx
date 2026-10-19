'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  Plus,
  Trash2,
  Edit3,
  Megaphone,
  CreditCard,
  Truck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Clock,
  Check,
  ExternalLink,
  Layers,
  AlertCircle,
  Eye,
  X,
  SlidersHorizontal,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  StoreSettings,
  SiteBanner,
  TrustBadgeItem,
  DEFAULT_STORE_SETTINGS,
} from '@/types/content';
import {
  getStoreSettings,
  updateStoreSettings,
  getSiteBanners,
  createSiteBanner,
  updateSiteBanner,
  deleteSiteBanner,
} from '@/lib/content/contentStore';

type ActiveTab = 'announcements' | 'trust_badges' | 'banners';

const ICON_OPTIONS: TrustBadgeItem['icon'][] = [
  'Truck',
  'CreditCard',
  'RotateCcw',
  'ShieldCheck',
  'Sparkles',
  'Clock',
];

function renderTrustIcon(iconName: TrustBadgeItem['icon']) {
  const props = { className: 'w-5 h-5 shrink-0', style: { width: 20, height: 20 } };
  switch (iconName) {
    case 'Truck':
      return <Truck {...props} />;
    case 'CreditCard':
      return <CreditCard {...props} />;
    case 'RotateCcw':
      return <RotateCcw {...props} />;
    case 'ShieldCheck':
      return <ShieldCheck {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Clock':
      return <Clock {...props} />;
    default:
      return <Sparkles {...props} />;
  }
}

export default function ContenidoAdminPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('announcements');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings State
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  // Banners State
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [bannerFilter, setBannerFilter] = useState<string>('all');
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SiteBanner | null>(null);

  // Banner Form State
  const [bannerForm, setBannerForm] = useState<Omit<SiteBanner, 'id' | 'created_at' | 'updated_at'>>({
    placement: 'hero_slide',
    title: '',
    subtitle: '',
    cta_text: 'Ver Colección',
    cta_link: '/tienda',
    image_url: '',
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [loadedSettings, loadedBanners] = await Promise.all([
          getStoreSettings(),
          getSiteBanners(),
        ]);
        if (mounted) {
          setSettings(loadedSettings);
          setBanners(loadedBanners);
        }
      } catch (err) {
        console.error('Error loading content data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isBannerModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBannerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBannerModalOpen]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updated = await updateStoreSettings(settings);
      setSettings(updated);
      showFeedback('success', 'Configuración de contenido guardada con éxito.');
    } catch {
      showFeedback('error', 'Error al guardar la configuración de contenido.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrustBadgeChange = (
    index: number,
    field: keyof TrustBadgeItem,
    value: any
  ) => {
    const updatedBadges = [...settings.trust_badges];
    updatedBadges[index] = {
      ...updatedBadges[index],
      [field]: value,
    };
    setSettings({ ...settings, trust_badges: updatedBadges });
  };

  const handleOpenBannerModal = (banner?: SiteBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        placement: banner.placement,
        title: banner.title,
        subtitle: banner.subtitle || '',
        cta_text: banner.cta_text,
        cta_link: banner.cta_link,
        image_url: banner.image_url,
        order_index: banner.order_index,
        is_active: banner.is_active,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        placement: 'hero_slide',
        title: '',
        subtitle: '',
        cta_text: 'Ver Colección',
        cta_link: '/tienda',
        image_url: '',
        order_index: banners.length,
        is_active: true,
      });
    }
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingBanner) {
        const updated = await updateSiteBanner(editingBanner.id, bannerForm);
        if (updated) {
          setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          showFeedback('success', 'Banner actualizado con éxito.');
        }
      } else {
        const created = await createSiteBanner(bannerForm);
        setBanners((prev) => [...prev, created]);
        showFeedback('success', 'Banner creado con éxito.');
      }
      setIsBannerModalOpen(false);
    } catch {
      showFeedback('error', 'Error al guardar el banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;
    setIsSaving(true);
    try {
      await deleteSiteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showFeedback('success', 'Banner eliminado.');
    } catch {
      showFeedback('error', 'Error al eliminar el banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBannerActive = async (banner: SiteBanner) => {
    const newStatus = !banner.is_active;
    try {
      const updated = await updateSiteBanner(banner.id, { is_active: newStatus });
      if (updated) {
        setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)));
        showFeedback('success', `Banner ${newStatus ? 'activado' : 'desactivado'}.`);
      }
    } catch {
      showFeedback('error', 'Error al cambiar estado del banner.');
    }
  };

  const filteredBanners = bannerFilter === 'all'
    ? banners
    : banners.filter((b) => b.placement === bannerFilter);

  return (
    <div
      style={{
        padding: 'var(--space-6) var(--space-4)',
        maxWidth: 1200,
        margin: '0 auto',
        overflowX: 'hidden',
        minHeight: '80vh',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-primary)',
              }}
            >
              <SlidersHorizontal style={{ width: 20, height: 20 }} />
            </span>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Gestión de Contenido
            </h1>
          </div>
          <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Configuración visual, barras promocionales, cuotas y banners dinámicos sin tocar código.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving || isLoading}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              minHeight: 44,
              padding: '0 var(--space-5)',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
            }}
            aria-label="Guardar configuración general"
          >
            {isSaving ? (
              <Clock className="w-4 h-4 shrink-0 animate-spin" style={{ width: 18, height: 18 }} />
            ) : (
              <Save className="w-4 h-4 shrink-0" style={{ width: 18, height: 18 }} />
            )}
            <span>{isSaving ? 'Guardando...' : 'Guardar Todo'}</span>
          </button>
        </div>
      </header>

      {/* Feedback Toast */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-6)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedback.type === 'success' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(212, 97, 58, 0.12)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(212, 97, 58, 0.3)'}`,
            color: feedback.type === 'success' ? 'var(--success)' : 'var(--error)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
          }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 style={{ width: 20, height: 20, flexShrink: 0 }} />
          ) : (
            <AlertCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <nav
        aria-label="Pestañas de gestión de contenido"
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 'var(--space-2)',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            minHeight: 44,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'announcements' ? 'var(--accent-light)' : 'transparent',
            color: activeTab === 'announcements' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'announcements' ? 600 : 500,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
          aria-selected={activeTab === 'announcements'}
        >
          <Megaphone style={{ width: 18, height: 18 }} />
          <span>Anuncios & Financiación</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trust_badges')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            minHeight: 44,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'trust_badges' ? 'var(--accent-light)' : 'transparent',
            color: activeTab === 'trust_badges' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'trust_badges' ? 600 : 500,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
          aria-selected={activeTab === 'trust_badges'}
        >
          <ShieldCheck style={{ width: 18, height: 18 }} />
          <span>Propuestas de Valor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            minHeight: 44,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'banners' ? 'var(--accent-light)' : 'transparent',
            color: activeTab === 'banners' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'banners' ? 600 : 500,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
          aria-selected={activeTab === 'banners'}
        >
          <ImageIcon style={{ width: 18, height: 18 }} />
          <span>Banners Visuales ({banners.length})</span>
        </button>
      </nav>

      {/* Tab 1: Anuncios y Financiación */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Announcement Bar Settings */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <Megaphone style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: 0 }}>
                Barra Superior de Anuncios
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
              Texto visible en la cinta superior de la tienda. Usado habitualmente para promociones urgentes o beneficios de compra.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <label
                  htmlFor="announcement_text"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}
                >
                  Texto del Anuncio
                </label>
                <input
                  id="announcement_text"
                  type="text"
                  value={settings.announcement_text}
                  onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                  placeholder="Ej: Envío gratis en compras mayores a $25.000 | 3 y 6 Cuotas Sin Interés"
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-base)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="announcement_link"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}
                >
                  Enlace de Destino (Opcional)
                </label>
                <input
                  id="announcement_link"
                  type="text"
                  value={settings.announcement_link || ''}
                  onChange={(e) => setSettings({ ...settings, announcement_link: e.target.value })}
                  placeholder="Ej: /tienda?collection=nueva-temporada"
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-base)',
                  }}
                />
              </div>
            </div>

            {/* Live Preview */}
            <div style={{ marginTop: 'var(--space-5)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vista Previa de la Barra
              </span>
              <div
                style={{
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textAlign: 'center',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {settings.announcement_text || 'Sin anuncio configurado'}
              </div>
            </div>
          </div>

          {/* Pricing & Free Shipping Threshold */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <CreditCard style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: 0 }}>
                Financiación y Políticas de Envío
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
              Valores calculados de forma dinámica en toda la tienda (PDP, carrito, Checkout y barra de progreso).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <label
                  htmlFor="free_shipping_threshold"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}
                >
                  Umbral de Envío Gratis ($)
                </label>
                <input
                  id="free_shipping_threshold"
                  type="number"
                  min="0"
                  step="1000"
                  value={settings.free_shipping_threshold}
                  onChange={(e) => setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-base)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="installments_qty"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}
                >
                  Cantidad Máxima de Cuotas
                </label>
                <input
                  id="installments_qty"
                  type="number"
                  min="1"
                  max="24"
                  value={settings.installments_qty}
                  onChange={(e) => setSettings({ ...settings, installments_qty: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-base)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="transfer_discount_percentage"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}
                >
                  Descuento por Transferencia (%)
                </label>
                <input
                  id="transfer_discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.transfer_discount_percentage}
                  onChange={(e) => setSettings({ ...settings, transfer_discount_percentage: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-base)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label
                  htmlFor="installments_interest_free"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', minHeight: 44 }}
                >
                  <input
                    id="installments_interest_free"
                    type="checkbox"
                    checked={settings.installments_interest_free}
                    onChange={(e) => setSettings({ ...settings, installments_interest_free: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    Cuotas Sin Interés activadas
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Propuestas de Valor / Trust Badges */}
      {activeTab === 'trust_badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <ShieldCheck style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: 0 }}>
                Propuestas de Valor (TrustBar)
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              Pilares de confianza visibles en la barra TrustBar de la Home y el Storefront.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
              {settings.trust_badges.map((badge, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      Beneficio #{idx + 1}
                    </span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--accent-primary)' }}>
                      {renderTrustIcon(badge.icon)}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`badge-icon-${idx}`}
                      style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}
                    >
                      Icono Lucide
                    </label>
                    <select
                      id={`badge-icon-${idx}`}
                      value={badge.icon}
                      onChange={(e) => handleTrustBadgeChange(idx, 'icon', e.target.value as any)}
                      style={{
                        width: '100%',
                        minHeight: 44,
                        padding: '0 var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-input)',
                        backgroundColor: 'var(--bg-surface)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`badge-title-${idx}`}
                      style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}
                    >
                      Título
                    </label>
                    <input
                      id={`badge-title-${idx}`}
                      type="text"
                      value={badge.title}
                      onChange={(e) => handleTrustBadgeChange(idx, 'title', e.target.value)}
                      placeholder="Ej: Envío a todo el país"
                      style={{
                        width: '100%',
                        minHeight: 44,
                        padding: '0 var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-input)',
                        backgroundColor: 'var(--bg-surface)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`badge-desc-${idx}`}
                      style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}
                    >
                      Descripción Corta
                    </label>
                    <input
                      id={`badge-desc-${idx}`}
                      type="text"
                      value={badge.description}
                      onChange={(e) => handleTrustBadgeChange(idx, 'description', e.target.value)}
                      placeholder="Ej: Llega en 3 a 5 días hábiles"
                      style={{
                        width: '100%',
                        minHeight: 44,
                        padding: '0 var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-input)',
                        backgroundColor: 'var(--bg-surface)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Live Preview TrustBar */}
            <div style={{ marginTop: 'var(--space-8)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vista Previa TrustBar
              </span>
              <div
                style={{
                  marginTop: 'var(--space-2)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-5)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {settings.trust_badges.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {renderTrustIcon(b.icon)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        {b.title || 'Título'}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {b.description || 'Descripción'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Banners Visuales */}
      {activeTab === 'banners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {(['all', 'hero_slide', 'collection_banner', 'middle_promo'] as const).map((placementKey) => (
                <button
                  key={placementKey}
                  type="button"
                  onClick={() => setBannerFilter(placementKey)}
                  style={{
                    minHeight: 44,
                    padding: '0 var(--space-4)',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-subtle)',
                    background: bannerFilter === placementKey ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: bannerFilter === placementKey ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {placementKey === 'all'
                    ? 'Todos'
                    : placementKey === 'hero_slide'
                    ? 'Hero Slider'
                    : placementKey === 'collection_banner'
                    ? 'Collection Banner'
                    : 'Middle Promo'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleOpenBannerModal()}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                minHeight: 44,
                padding: '0 var(--space-4)',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}
              aria-label="Agregar nuevo banner"
            >
              <Plus style={{ width: 18, height: 18 }} />
              <span>Nuevo Banner</span>
            </button>
          </div>

          {/* Banners Grid */}
          {filteredBanners.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-12) var(--space-4)',
                textAlign: 'center',
              }}
            >
              <ImageIcon style={{ width: 40, height: 40, color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1)' }}>
                No hay banners en esta sección
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Hacé click en &ldquo;Nuevo Banner&rdquo; para sumar un slide o banner promocional.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              {filteredBanners.map((banner) => (
                <div
                  key={banner.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform var(--transition-fast)',
                  }}
                >
                  {/* Banner Image Preview */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 180,
                      backgroundColor: 'var(--bg-subtle)',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'var(--space-2)',
                        left: 'var(--space-2)',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {banner.placement}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        top: 'var(--space-2)',
                        right: 'var(--space-2)',
                        backgroundColor: banner.is_active ? 'rgba(76, 175, 80, 0.9)' : 'rgba(212, 97, 58, 0.9)',
                        color: 'white',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                      }}
                    >
                      {banner.is_active ? 'Activo' : 'Pausado'}
                    </div>
                  </div>

                  {/* Banner Details */}
                  <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1)' }}>
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-secondary)',
                          margin: '0 0 var(--space-3)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {banner.subtitle}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      <span>Botón: <strong>{banner.cta_text}</strong></span>
                      <span>•</span>
                      <span>Enlace: <strong>{banner.cta_link}</strong></span>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: 'var(--space-3)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleBannerActive(banner)}
                        style={{
                          minHeight: 44,
                          padding: '0 var(--space-3)',
                          border: 'none',
                          background: 'transparent',
                          color: banner.is_active ? 'var(--text-secondary)' : 'var(--accent-primary)',
                          fontWeight: 600,
                          fontSize: 'var(--text-xs)',
                          cursor: 'pointer',
                        }}
                      >
                        {banner.is_active ? 'Pausar' : 'Activar'}
                      </button>

                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenBannerModal(banner)}
                          style={{
                            minWidth: 44,
                            minHeight: 44,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                          aria-label={`Editar banner ${banner.title}`}
                        >
                          <Edit3 style={{ width: 18, height: 18 }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(banner.id)}
                          style={{
                            minWidth: 44,
                            minHeight: 44,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--error)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                          aria-label={`Eliminar banner ${banner.title}`}
                        >
                          <Trash2 style={{ width: 18, height: 18 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Crear/Editar Banner */}
      {isBannerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsBannerModalOpen(false);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)',
            backgroundColor: 'var(--bg-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
              padding: 'var(--space-6)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>
                {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
              </h2>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Cerrar modal"
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label
                  htmlFor="form_placement"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}
                >
                  Ubicación (Placement)
                </label>
                <select
                  id="form_placement"
                  value={bannerForm.placement}
                  onChange={(e) => setBannerForm({ ...bannerForm, placement: e.target.value as any })}
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  <option value="hero_slide">Hero Slide (Slider principal)</option>
                  <option value="collection_banner">Collection Banner (Banner de temporada)</option>
                  <option value="middle_promo">Middle Promo (Promoción intermedia)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="form_title"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}
                >
                  Título
                </label>
                <input
                  id="form_title"
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="Ej: Nueva Colección Primavera"
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="form_subtitle"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}
                >
                  Subtítulo / Bajada (Opcional)
                </label>
                <textarea
                  id="form_subtitle"
                  rows={2}
                  value={bannerForm.subtitle || ''}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="Ej: Siluetas ligeras y texturas naturales diseñadas para vos"
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <label
                    htmlFor="form_cta_text"
                    style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}
                  >
                    Texto del Botón CTA
                  </label>
                  <input
                    id="form_cta_text"
                    type="text"
                    required
                    value={bannerForm.cta_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, cta_text: e.target.value })}
                    placeholder="Ej: Ver Colección"
                    style={{
                      width: '100%',
                      minHeight: 44,
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="form_cta_link"
                    style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}
                  >
                    Enlace de Destino CTA
                  </label>
                  <input
                    id="form_cta_link"
                    type="text"
                    required
                    value={bannerForm.cta_link}
                    onChange={(e) => setBannerForm({ ...bannerForm, cta_link: e.target.value })}
                    placeholder="Ej: /tienda?collection=primavera"
                    style={{
                      width: '100%',
                      minHeight: 44,
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="form_image_url"
                  style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}
                >
                  URL de Imagen
                </label>
                <input
                  id="form_image_url"
                  type="url"
                  required
                  value={bannerForm.image_url}
                  onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div>
                  <label
                    htmlFor="form_order"
                    style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}
                  >
                    Orden
                  </label>
                  <input
                    id="form_order"
                    type="number"
                    min="0"
                    value={bannerForm.order_index}
                    onChange={(e) => setBannerForm({ ...bannerForm, order_index: Number(e.target.value) })}
                    style={{
                      width: 100,
                      minHeight: 44,
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>

                <label
                  htmlFor="form_is_active"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', minHeight: 44 }}
                >
                  <input
                    id="form_is_active"
                    type="checkbox"
                    checked={bannerForm.is_active}
                    onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Banner Activo</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  style={{
                    minHeight: 44,
                    padding: '0 var(--space-4)',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{
                    minHeight: 44,
                    padding: '0 var(--space-5)',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSaving ? 'Guardando...' : editingBanner ? 'Actualizar' : 'Crear Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
