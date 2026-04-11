import Hero from '@/components/home/Hero';
import CategoriesBento from '@/components/home/CategoriesBento';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CollectionBanner from '@/components/home/CollectionBanner';

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesBento />
      <FeaturedProducts />
      <CollectionBanner />
    </>
  );
}
