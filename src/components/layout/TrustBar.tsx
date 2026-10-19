import { Truck, CreditCard, RotateCcw } from "lucide-react";
import styles from "./TrustBar.module.css";

const items = [
  { icon: Truck, text: "Envío gratis desde $25.000" },
  { icon: CreditCard, text: "3 cuotas sin interés" },
  { icon: RotateCcw, text: "Devolución fácil en 10 días" },
];

export default function TrustBar() {
  return (
    <div className={styles.trustBar} role="complementary" aria-label="Beneficios de compra">
      <div className={`container ${styles.inner}`}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.text} className={styles.item}>
              <span className={styles.icon} aria-hidden="true">
                <Icon size={16} strokeWidth={2} />
              </span>
              <span className={styles.text}>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
