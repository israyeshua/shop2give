import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { formatCurrency } from '../lib/utils';
import { useCartStore } from '../stores/cartStore';

type ProductCardProps = {
  product: {
    id: string;
    title?: string;
    name?: string;
    price: number;
    imageUrl: string;
    badge?: 'SALE' | 'NEW' | 'LIMITED';
    campaignId?: string;
  };
  campaignId?: string;
};

export function ProductCard({ product, campaignId }: ProductCardProps) {
  const { addToCart } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    // If campaignId is provided as a prop, use that, otherwise use product's campaignId if available
    const productWithCampaign = campaignId ? { ...product, campaignId } : product;
    
    // Pass product with campaign ID to cart store
    addToCart(productWithCampaign, 1);
  };

  return (
    <Link 
      to={`/products/${product.id}`}
      className="group block transform transition-all duration-300 hover:-translate-y-1"
    >
      <Card className="overflow-hidden">
        <div className="relative aspect-square bg-white">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.badge && (
            <div className="absolute right-4 top-4">
              <Badge variant={product.badge === 'SALE' ? 'warning' : 'info'}>
                {product.badge}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-6 bg-brand-pink bg-opacity-30">
          <h3 className="font-serif text-lg font-semibold text-brand-charcoal mb-2">
            {product.title || product.name}
          </h3>
          <p className="text-xl font-bold text-brand-charcoal mb-4">
            {formatCurrency(product.price)}
          </p>
          <Button 
            variant="primary"
            className="w-full"
            onClick={handleAddToCart}
          >
            Add to cart
          </Button>
        </div>
      </Card>
    </Link>
  );
}