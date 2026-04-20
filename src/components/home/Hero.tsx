import Link from 'next/link';
import HeroSearch from './HeroSearch';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.heroSection} id="hero-section">
      <div className="container">
        {/* Functional Search Bar */}
        <div className={styles.searchContainer}>
          <HeroSearch />
        </div>

        {/* Hero Slider Card */}
        <div className={styles.sliderCard}>
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop&q=80"
            alt="Nueva colección"
            className={styles.sliderImage}
            fetchPriority="high"
          />
          <div className={styles.sliderOverlay}>
            <div className={styles.sliderContent}>
              <span className={styles.tagline}>NUEVA TEMPORADA 🍂✨</span>
              <h1 className={`${styles.title} font-editorial`}>Dejanos<br/>ayudarte</h1>
              <Link href="/tienda" className={`btn btn-primary btn-sm ${styles.cta}`}>
                Descubrí los outfits
              </Link>
            </div>
            
            {/* Dots indicator */}
            <div className={styles.dotsContainer}>
              <span className={`${styles.dot} ${styles.dotActive}`}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
