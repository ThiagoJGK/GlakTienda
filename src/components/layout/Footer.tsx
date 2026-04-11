import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className="font-heading">GLAK</span>
          </Link>
          <p className={styles.tagline}>
            Moda femenina con alma orgánica.
            <br />
            Envíos a todo el país.
          </p>
        </div>

        {/* Quick Links */}
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Tienda</h4>
          <ul className={styles.list}>
            <li><Link href="/tienda">Ver todo</Link></li>
            <li><Link href="/tienda?cat=vestidos">Vestidos</Link></li>
            <li><Link href="/tienda?cat=camisas">Camisas</Link></li>
            <li><Link href="/tienda?cat=pantalones">Pantalones</Link></li>
          </ul>
        </div>

        {/* Help */}
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Ayuda</h4>
          <ul className={styles.list}>
            <li><Link href="/talles">Guía de Talles</Link></li>
            <li><Link href="/politicas">Envíos y Devoluciones</Link></li>
            <li><Link href="/politicas#arrepentimiento">Botón de Arrepentimiento</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Contacto</h4>
          <ul className={styles.list}>
            <li>
              <a href="https://instagram.com/glak.ar" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://wa.me/543436000000" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href="mailto:hola@glak.com.ar">
                hola@glak.com.ar
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottom}>
        <div className="container">
          <p>© {new Date().getFullYear()} Glak. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
