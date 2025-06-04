import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '../types/index';

interface CartState {
  items: CartItem[];
  addToCart: (product: any, quantity: number, campaignId?: string) => void;
  removeFromCart: (productId: string, campaignId?: string) => void;
  updateQuantity: (productId: string, quantity: number, campaignId?: string) => void;
  setProductCampaign: (productId: string, campaignId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (productInput: any, quantity: number, campaignId?: string) => {
        // Convert any product to the expected Product type
        const product: Product = {
          id: productInput.id,
          name: productInput.name || productInput.title || 'Product',
          description: productInput.description || 'Product description',
          price: productInput.price,
          imageUrl: productInput.imageUrl,
          category: productInput.category || 'general',
          priceId: productInput.priceId || productInput.stripePriceId || 'price_default',
          campaignId: campaignId || productInput.campaignId,
          stripeProductId: productInput.stripeProductId,
          stripePriceId: productInput.stripePriceId,
        };
        
        set((state) => {
          // Find existing item with same product ID and campaign ID
          const existingItem = state.items.find(
            (item) => 
              item.product.id === product.id && 
              item.product.campaignId === product.campaignId
          );

          if (existingItem) {
            // Update quantity if same product + campaign combination exists
            return {
              items: state.items.map((item) =>
                item.id === existingItem.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          } else {
            // Add as new item if product + campaign combination is unique
            return {
              items: [...state.items, { 
                id: `${product.id}-${product.campaignId || 'no-campaign'}-${Date.now()}`, 
                product, 
                quantity 
              }],
            };
          }
        });
      },
      
      removeFromCart: (productId, campaignId) => set((state) => ({
        items: state.items.filter(item => 
          !(item.product.id === productId && item.product.campaignId === campaignId)
        )
      })),
      
      updateQuantity: (productId, quantity, campaignId) => set((state) => ({
        items: state.items.map(item => 
          (item.product.id === productId && item.product.campaignId === campaignId)
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
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({ items: state.items }),
    }
  )
);