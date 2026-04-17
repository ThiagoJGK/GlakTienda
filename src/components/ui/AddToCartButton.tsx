'use client';

import { useCartStore } from '@/stores/cartStore';
import styles from './AddToCartButton.module.css';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    href: string;
  };
  selectedSize: string;
  selectedColor: string;
}

export default function AddToCartButton({ product, selectedSize, selectedColor }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      href: product.href,
      size: selectedSize,
      color: selectedColor,
    });
  };

  return (
    <div className={styles.ctaRow}>
      <button className={`btn btn-secondary ${styles.btnCart}`} onClick={handleAdd}>
        Agregar al Carrito
      </button>
      <button className={`btn btn-primary ${styles.btnBuy}`} onClick={handleAdd}>
        Comprar Ahora
      </button>
    </div>
  );
}
