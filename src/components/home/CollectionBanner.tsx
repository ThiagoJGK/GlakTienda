import Link from 'next/link';
import styles from './CollectionBanner.module.css';

export default function CollectionBanner() {
  return (
    <section className={`section ${styles.section}`} id="collection-banner">
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          <span className={styles.tag}>NUEVA TEMPORADA</span>
          <h2 className={`${styles.title} font-editorial`}>
            Colección Otoño 2026
          </h2>
          <p className={styles.description}>
            Texturas naturales, siluetas fluidas y una paleta que abraza la tierra.
            Prendas diseñadas para acompañar tu día con elegancia consciente.
          </p>
          <Link href="/tienda" className={`btn btn-primary ${styles.cta}`} id="collection-cta">
            Descubrir
          </Link>
        </div>
        <div className={styles.imageWrapper}>
          <img
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=700&fit=crop&q=75"
            alt="Colección Otoño 2026 — Moda femenina natural"
            className={styles.image}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
