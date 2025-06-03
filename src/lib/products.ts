import { create } from 'zustand';
import { SupabaseProductsService, Product as SupabaseProduct } from '../api/supabase/products';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  featured: boolean;
  stockQuantity: number;
  priceId: string;
  campaignId: string | null;
  created_at: string;
  updated_at: string | null;
  stripeProductId?: string;
}

type ProductState = {
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  fetchProducts: (campaignId?: string) => Promise<Product[]>;
  fetchFeaturedProducts: () => Promise<Product[]>;
  fetchProductById: (id: string) => Promise<Product | null>;
  fetchProductsByCampaign: (campaignId: string) => Promise<Product[]>;
  fetchProductsByCategory: (category: string) => Promise<Product[]>;
  createProduct: (product: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  linkProductToCampaign: (productId: string, campaignId: string) => Promise<void>;
  unlinkProductFromCampaign: (productId: string) => Promise<void>;
  updateCampaignProductProfitPercentage: (productId: string, campaignId: string, percentage: number) => Promise<void>;
  setCurrentProduct: (product: Product | null) => void;
  reset: () => void;
};

export const useProducts = create<ProductState>()(persist((set, get) => ({
  products: [],
  featuredProducts: [],
  currentProduct: null,
  isLoading: false,
  error: null,

  fetchProducts: async (campaignId) => {
    set({ isLoading: true });
    try {
      let products: Product[];
      
      if (campaignId) {
        products = await SupabaseProductsService.getProductsByCampaign(campaignId);
      } else {
        products = await SupabaseProductsService.getAllProducts();
      }
      
      set({ products, isLoading: false, error: null });
      return products;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },
  
  fetchFeaturedProducts: async () => {
    set({ isLoading: true });
    try {
      const featuredProducts = await SupabaseProductsService.getFeaturedProducts();
      set({ featuredProducts, isLoading: false, error: null });
      return featuredProducts;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },
  
  fetchProductById: async (id: string) => {
    set({ isLoading: true });
    try {
      const product = await SupabaseProductsService.getProductById(id);
      if (product) {
        set({ currentProduct: product, isLoading: false, error: null });
      } else {
        set({ isLoading: false, error: 'Product not found' });
      }
      return product;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },
  
  fetchProductsByCampaign: async (campaignId: string) => {
    set({ isLoading: true });
    try {
      const products = await SupabaseProductsService.getProductsByCampaign(campaignId);
      set({ products, isLoading: false, error: null });
      return products;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },
  
  fetchProductsByCategory: async (category: string) => {
    set({ isLoading: true });
    try {
      const products = await SupabaseProductsService.getProductsByCategory(category);
      set({ products, isLoading: false, error: null });
      return products;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },

  createProduct: async (product) => {
    try {
      set({ isLoading: true });
      const newProduct = await SupabaseProductsService.createProduct(product as Partial<SupabaseProduct>);
      
      const products = get().products;
      set({ products: [...products, newProduct], isLoading: false, error: null });
      
      return newProduct;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    try {
      set({ isLoading: true });
      await SupabaseProductsService.updateProduct(id, updates as Partial<SupabaseProduct>);

      const products = get().products.map(p => 
        p.id === id ? { ...p, ...updates } : p
      );
      
      // Also update currentProduct if it's the one being updated
      const currentProduct = get().currentProduct;
      if (currentProduct && currentProduct.id === id) {
        set({ currentProduct: { ...currentProduct, ...updates } });
      }
      
      set({ products, isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      set({ isLoading: true });
      await SupabaseProductsService.deleteProduct(id);

      const products = get().products.filter(p => p.id !== id);
      
      // If the deleted product is the current product, reset it
      const currentProduct = get().currentProduct;
      if (currentProduct && currentProduct.id === id) {
        set({ currentProduct: null });
      }
      
      set({ products, isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  linkProductToCampaign: async (productId, campaignId) => {
    try {
      set({ isLoading: true });
      await SupabaseProductsService.linkProductToCampaign(productId, campaignId);
      
      // Update the product in the state
      const products = get().products.map(p => 
        p.id === productId ? { ...p, campaignId } : p
      );
      
      // Also update currentProduct if it's the one being updated
      const currentProduct = get().currentProduct;
      if (currentProduct && currentProduct.id === productId) {
        set({ currentProduct: { ...currentProduct, campaignId } });
      }
      
      set({ products, isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  unlinkProductFromCampaign: async (productId) => {
    try {
      set({ isLoading: true });
      await SupabaseProductsService.unlinkProductFromCampaign(productId);
      
      // Update the product in the state
      const products = get().products.map(p => 
        p.id === productId ? { ...p, campaignId: null } : p
      );
      
      // Also update currentProduct if it's the one being updated
      const currentProduct = get().currentProduct;
      if (currentProduct && currentProduct.id === productId) {
        set({ currentProduct: { ...currentProduct, campaignId: null } });
      }
      
      set({ products, isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  updateCampaignProductProfitPercentage: async (productId, campaignId, percentage) => {
    try {
      set({ isLoading: true });
      await SupabaseProductsService.updateCampaignProductProfitPercentage(productId, campaignId, percentage);
      set({ isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  setCurrentProduct: (product) => {
    set({ currentProduct: product });
  },
  
  reset: () => {
    set({ products: [], featuredProducts: [], currentProduct: null, isLoading: false, error: null });
  },
}), {
  name: 'product-store',
  partialize: (state) => ({
    products: state.products,
    featuredProducts: state.featuredProducts,
    currentProduct: state.currentProduct
  }),
}));