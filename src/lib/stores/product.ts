```typescript
import { create } from 'zustand';
import { supabase } from '../supabase';

interface Product {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  creator_amount: number;
  max_cause_amount: number;
  inventory_count: number;
  is_active: boolean;
  stripe_product_id: string | null;
}

interface ProductStore {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: (creatorId: string) => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'stripe_product_id'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  uploadProductImage: (productId: string, file: File) => Promise<string>;
  toggleProductStatus: (id: string) => Promise<void>;
}

export const useProduct = create<ProductStore>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async (creatorId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ products: products || [], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createProduct: async (product) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({
        products: [newProduct, ...state.products],
        isLoading: false
      }));

      return newProduct;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      set(state => ({
        products: state.products.map(p => 
          p.id === id ? { ...p, ...updates } : p
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  uploadProductImage: async (productId: string, file: File) => {
    try {
      set({ isLoading: true, error: null });
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${productId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const product = get().products.find(p => p.id === productId);
      if (product) {
        const images = [...product.images, publicUrl];
        await get().updateProduct(productId, { images });
      }

      return publicUrl;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  toggleProductStatus: async (id: string) => {
    const product = get().products.find(p => p.id === id);
    if (!product) return;

    try {
      await get().updateProduct(id, { is_active: !product.is_active });
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  },
}));
```