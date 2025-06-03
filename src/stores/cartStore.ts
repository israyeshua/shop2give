import { create } from 'zustand';
import { CartItem, Product } from '../types/index';

interface CartState {
  items: CartItem[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setProductCampaign: (productId: string, campaignId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addToCart: (productInput: any, quantity: number) => {
    // Convert any product to the expected Product type
    const product: Product = {
      id: productInput.id,
      name: productInput.name || productInput.title || 'Product',
      description: productInput.description || 'Product description',
      price: productInput.price,
      imageUrl: productInput.imageUrl,
      category: productInput.category || 'general',
      priceId: productInput.priceId || productInput.stripePriceId || 'price_default',
      campaignId: productInput.campaignId,
      stripeProductId: productInput.stripeProductId,
      stripePriceId: productInput.stripePriceId,
    };
    
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      } else {
        return {
          items: [...state.items, { id: `${product.id}-${Date.now()}`, product, quantity }],
        };
      }
    });
  },
  
  removeFromCart: (productId) => set((state) => ({
    items: state.items.filter(item => item.product.id !== productId)
  })),
  
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map(item => 
      item.product.id === productId 
        ? { ...item, quantity } 
        : item
    )
  })),
  
  setProductCampaign: (productId, campaignId) => set((state) => ({
    items: state.items.map(item => 
      item.product.id === productId 
        ? { 
            ...item, 
            product: { 
              ...item.product, 
              campaignId 
            } 
          } 
        : item
    )
  })),
  
  clearCart: () => set({ items: [] }),
  
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }
}));
