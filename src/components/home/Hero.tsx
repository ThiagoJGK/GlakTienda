import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero} id="hero-section">
      <div className={styles.imageWrapper}>
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop&q=80"
          alt="Mujer con ropa de estilo natural y elegante"
          className={styles.image}
          fetchPriority="high"
          decoding="async"
        />
        <div className={styles.overlay} />
      </div>
      <div className={styles.content}>
        <span className={styles.tagline}>NUEVA COLECCIÓN OTOÑO 2026</span>
        <h1 className={`${styles.title} font-editorial`}>
          Moda con<br />
          <em>alma orgánica</em>
        </h1>
        <p className={styles.subtitle}>
          Descubrí prendas que visten con intención
        </p>
        <a href="/tienda" className={`btn btn-primary btn-lg ${styles.cta}`} id="hero-cta">
          Ver Colección
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>
  );
}
