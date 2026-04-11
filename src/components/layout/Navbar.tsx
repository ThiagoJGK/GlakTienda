import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <header className={`glass-navbar ${styles.navbar}`}>
      <nav className={`container ${styles.nav}`} aria-label="Navegación principal">
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="Glak — Inicio">
          <span className="font-heading">GLAK</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className={`${styles.links} hide-mobile`}>
          <li>
            <Link href="/tienda" className={styles.link}>
              Tienda
            </Link>
          </li>
          <li>
            <Link href="/nosotros" className={styles.link}>
              Nosotros
            </Link>
          </li>
        </ul>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Search */}
          <button
            className={`btn-ghost ${styles.iconBtn}`}
            aria-label="Buscar"
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {/* User */}
          <Link
            href="/mi-cuenta"
            className={`btn-ghost ${styles.iconBtn} hide-mobile`}
            aria-label="Mi cuenta"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          {/* Cart */}
          <Link
            href="/carrito"
            className={`btn-ghost ${styles.iconBtn}`}
            aria-label="Carrito de compras"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </Link>
        </div>
      </nav>
    </header>
  );
}
