import ProductCard from '@/components/ui/ProductCard';
import SectionTitle from '@/components/ui/SectionTitle';
import styles from './FeaturedProducts.module.css';

/* Mock data — will come from Supabase later */
const products = [
  {
    name: 'Vestido Lino Natural',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=530&fit=crop&q=75',
    href: '/producto/vestido-lino-natural',
    badge: 'NUEVO',
    category: 'VESTIDOS',
  },
  {
    name: 'Camisa Orgánica Blanca',
    price: 14500,
    image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=400&h=530&fit=crop&q=75',
    href: '/producto/camisa-organica-blanca',
    category: 'CAMISAS',
  },
  {
    name: 'Pantalón Wide Leg Oliva',
    price: 21300,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=530&fit=crop&q=75',
    href: '/producto/pantalon-wide-leg-oliva',
    category: 'PANTALONES',
  },
  {
    name: 'Blazer Estructurado Beige',
    price: 28700,
    image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&h=530&fit=crop&q=75',
    href: '/producto/blazer-estructurado-beige',
    badge: 'BESTSELLER',
    category: 'ABRIGOS',
  },
  {
    name: 'Vestido Midi Terracotta',
    price: 22100,
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=530&fit=crop&q=75',
    href: '/producto/vestido-midi-terracotta',
    category: 'VESTIDOS',
  },
  {
    name: 'Blusa Satinada Champagne',
    price: 16800,
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=530&fit=crop&q=75',
    href: '/producto/blusa-satinada-champagne',
    badge: 'NUEVO',
    category: 'BLUSAS',
  },
];

export default function FeaturedProducts() {
  return (
    <section className={`section ${styles.section}`} id="featured-section">
      <div className="container">
        <SectionTitle
          title="Lo más elegido"
          editorial
          action={{ label: 'Ver todo', href: '/tienda' }}
        />
      </div>
      <div className={styles.scrollWrapper}>
        <div className={styles.scrollTrack}>
          {products.map((product) => (
            <div key={product.name} className={styles.cardSlot}>
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
