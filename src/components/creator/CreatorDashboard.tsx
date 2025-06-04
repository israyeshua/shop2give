```typescript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useCreator } from '../../lib/stores/creator';
import { useProduct } from '../../lib/stores/product';
import { ProductList } from './ProductList';
import { ProductForm } from './ProductForm';

export function CreatorDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { creator, initialize: initializeCreator } = useCreator();
  const { products, fetchProducts } = useProduct();
  const [showProductForm, setShowProductForm] = React.useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'creator') {
      navigate('/auth');
      return;
    }

    initializeCreator();
  }, [user, profile, navigate, initializeCreator]);

  useEffect(() => {
    if (creator) {
      fetchProducts(creator.id);
    }
  }, [creator, fetchProducts]);

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{creator.business_name}</h1>
          <p className="text-gray-600">{creator.description}</p>
        </div>
        <button
          onClick={() => setShowProductForm(true)}
          className="bg-brand-teal text-white px-4 py-2 rounded-md hover:bg-brand-teal-dark transition-colors"
        >
          Add New Product
        </button>
      </div>

      {showProductForm && (
        <div className="mb-8">
          <ProductForm
            onSubmit={async (data) => {
              await useProduct.getState().createProduct({
                ...data,
                creator_id: creator.id,
                images: [],
                is_active: true,
              });
              setShowProductForm(false);
            }}
            onCancel={() => setShowProductForm(false)}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Your Products</h2>
        <ProductList products={products} />
      </div>
    </div>
  );
}
```