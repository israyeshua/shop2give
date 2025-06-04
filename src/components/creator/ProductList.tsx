```typescript
import React from 'react';
import { useProduct } from '../../lib/stores/product';
import { Switch } from '@headlessui/react';
import { formatCurrency } from '../../lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  creator_amount: number;
  max_cause_amount: number;
  inventory_count: number;
  is_active: boolean;
}

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const { toggleProductStatus } = useProduct();

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products yet. Add your first product to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between border-b border-gray-200 pb-6"
        >
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 flex-shrink-0">
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover rounded-md"
                />
              ) : (
                <div className="h-full w-full bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.category}</p>
              <div className="mt-1 space-x-4 text-sm text-gray-500">
                <span>Creator: {formatCurrency(product.creator_amount)}</span>
                <span>Max Cause: {formatCurrency(product.max_cause_amount)}</span>
                <span>Stock: {product.inventory_count}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Switch
              checked={product.is_active}
              onChange={() => toggleProductStatus(product.id)}
              className={`${
                product.is_active ? 'bg-brand-teal' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2`}
            >
              <span
                className={`${
                  product.is_active ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
            <button
              onClick={() => {/* Add edit functionality */}}
              className="text-sm text-brand-teal hover:text-brand-teal-dark"
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```