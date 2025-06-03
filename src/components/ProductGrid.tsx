
import { ProductCard } from './ProductCard';
import { Product } from '../data/products';

type ProductGridProps = {
  products: Product[];
  title?: string;
  campaignId?: string;
};

export function ProductGrid({ products, title, campaignId }: ProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-gray-200 py-12">
      <h2 className="mb-8 text-2xl font-bold text-blue-900">
        {title || "Support this cause by purchasing a gift"}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} campaignId={campaignId || product.campaignId} />
        ))}
      </div>
    </section>
  );
}