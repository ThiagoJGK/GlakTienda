import styles from "./TrustBar.module.css";

const items = [
  { icon: "🚚", text: "Envío gratis desde $25.000" },
  { icon: "💳", text: "3 cuotas sin interés" },
  { icon: "🔄", text: "Devolución fácil en 10 días" },
];

export default function TrustBar() {
  return (
    <div className={styles.trustBar} role="complementary" aria-label="Beneficios de compra">
      <div className={`container ${styles.inner}`}>
        {items.map((item) => (
          <div key={item.text} className={styles.item}>
            <span className={styles.icon} aria-hidden="true">{item.icon}</span>
            <span className={styles.text}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
