import Link from 'next/link';
import styles from './CollectionBanner.module.css';
import { getSiteBanners } from '@/lib/content/contentStore';
import { SiteBanner } from '@/types/content';

interface CollectionBannerProps {
  banner?: SiteBanner;
}

export default async function CollectionBanner({ banner: propBanner }: CollectionBannerProps = {}) {
  let banner = propBanner;
  if (!banner) {
    const banners = await getSiteBanners('collection_banner');
    banner = banners.find((b) => b.is_active);
  }

  if (!banner || !banner.is_active) {
    return null;
  }

  const title = banner.title || 'Colección Otoño 2026';
  const subtitle =
    banner.subtitle ||
    'Texturas naturales, siluetas fluidas y una paleta que abraza la tierra. Prendas diseñadas para acompañar tu día con elegancia consciente.';
  const ctaText = banner.cta_text || 'Descubrir';
  const ctaLink = banner.cta_link || '/tienda';
  const imageUrl =
    banner.image_url ||
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=700&fit=crop&q=75';

  return (
    <section className={`section ${styles.section}`} id="collection-banner">
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          <span className={styles.tag}>NUEVA TEMPORADA</span>
          <h2 className={`${styles.title} font-editorial`}>
            {title}
          </h2>
          {subtitle && (
            <p className={styles.description}>
              {subtitle}
            </p>
          )}
          <Link href={ctaLink} className={`btn btn-primary ${styles.cta}`} id="collection-cta">
            {ctaText}
          </Link>
        </div>
        <div className={styles.imageWrapper}>
          <img
            src={imageUrl}
            alt={`${title} — Glak Tienda`}
            className={styles.image}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
