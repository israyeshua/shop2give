import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StripeService } from '../api/stripe/payments';
import { Product } from './products';

// Make sure we have the right console logging for debugging
console.log('Checkout store initializing');

// Local cart item that contains full product details
export interface CartItem {
  product: Product;
  quantity: number;
  campaignId?: string;
  donationAmount?: number;
}

// Cart item interface for storing product info with optional campaign and donation data

export interface CheckoutState {
  // Cart state
  cartItems: CartItem[];
  isLoading: boolean;
  error: string | null;
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  lastSuccessfulPayment: {
    sessionId: string;
    amount: number;
    items: CartItem[];
  } | null;
  
  // Cart actions
  addToCart: (product: Product, quantity: number, campaignId?: string, donationAmount?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDonationAmount: (productId: string, donationAmount: number) => void;
  clearCart: () => void;
  
  // Checkout actions
  createCheckoutSession: (successUrl: string, cancelUrl: string) => Promise<string | null>;
  retrieveCheckoutSession: (sessionId: string) => Promise<any>;
  createDonationPayment: (amount: number, campaignId: string, successUrl: string, cancelUrl: string) => Promise<string | null>;
  setCheckoutSuccess: (sessionId: string, amount: number, items: CartItem[]) => void;
  reset: () => void;
}

export const useCheckout = create<CheckoutState>()(persist((set, get) => ({
  // Initial state
  cartItems: [],
  isLoading: false,
  error: null,
  checkoutSessionId: null,
  checkoutUrl: null,
  lastSuccessfulPayment: null,
  
  // Cart actions
  addToCart: (product, quantity, campaignId, donationAmount) => {
    const { cartItems } = get();
    
    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.product.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Product exists, update quantity
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingItemIndex] = {
        ...updatedCartItems[existingItemIndex],
        quantity: updatedCartItems[existingItemIndex].quantity + quantity,
        campaignId: campaignId || updatedCartItems[existingItemIndex].campaignId,
        donationAmount: donationAmount || updatedCartItems[existingItemIndex].donationAmount
      };
      
      set({ cartItems: updatedCartItems });
    } else {
      // New product
      const newItem: CartItem = {
        product,
        quantity,
        campaignId,
        donationAmount
      };
      
      set({ cartItems: [...cartItems, newItem] });
    }
  },
  
  removeFromCart: (productId) => {
    const { cartItems } = get();
    const updatedCartItems = cartItems.filter(item => item.product.id !== productId);
    set({ cartItems: updatedCartItems });
  },
  
  updateQuantity: (productId, quantity) => {
    const { cartItems } = get();
    
    if (quantity <= 0) {
      // Remove item if quantity is zero or negative
      return get().removeFromCart(productId);
    }
    
    const updatedCartItems = cartItems.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    );
    
    set({ cartItems: updatedCartItems });
  },
  
  updateDonationAmount: (productId, donationAmount) => {
    const { cartItems } = get();
    
    const updatedCartItems = cartItems.map(item => 
      item.product.id === productId ? { ...item, donationAmount } : item
    );
    
    set({ cartItems: updatedCartItems });
  },
  
  clearCart: () => {
    set({ cartItems: [] });
  },
  
  // Checkout actions
  createCheckoutSession: async (successUrl, cancelUrl) => {
    try {
      set({ isLoading: true, error: null });
      
      const { cartItems } = get();
      
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // Get campaign ID from the first item that has one (if any)
      const campaignId = cartItems.find(item => item.campaignId)?.campaignId;
      
      // Get user email if available
      const userEmail = undefined; // Would come from auth store if implemented
      
      // Convert our cart items to the format expected by the cart.ts module
      // Which has the CartItem type being used by the StripeService
      const cartCompatibleItems = cartItems.map(item => ({
        id: item.product.id,
        productId: item.product.id,
        priceId: item.product.priceId,
        name: item.product.name,
        price: item.product.price,
        imageUrl: item.product.imageUrl || '',
        quantity: item.quantity,
        campaignId: item.campaignId
      }));
      
      // Note: StripeService.createCheckoutSession redirects directly to Stripe
      // and doesn't return a session ID
      try {
        await StripeService.createCheckoutSession(
          cartCompatibleItems as any,
          userEmail,
          campaignId,
          successUrl,
          cancelUrl
        );
      } catch (stripeError) {
        console.error('Stripe checkout error:', stripeError);
        throw new Error(`Error creating checkout session: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
      }
      
      // This code won't actually run because the above redirects to Stripe
      set({ isLoading: false });
      return null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create checkout session', 
        isLoading: false 
      });
      return null;
    }
  },
  
  retrieveCheckoutSession: async (sessionId) => {
    try {
      set({ isLoading: true, error: null });
      
      const session = await StripeService.getCheckoutSession(sessionId);
      
      set({ isLoading: false });
      return session;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to retrieve session', 
        isLoading: false 
      });
      return null;
    }
  },
  
  createDonationPayment: async (amount, campaignId, successUrl, cancelUrl) => {
    try {
      set({ isLoading: true, error: null });
      
      // Create metadata for the payment
      const metadata = {
        successUrl,
        cancelUrl
      };
      
      const paymentData = await StripeService.createDonationPaymentIntent(amount, campaignId, metadata);
      
      set({ 
        checkoutSessionId: paymentData.id, 
        checkoutUrl: paymentData.url,
        isLoading: false 
      });
      
      return paymentData.id;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create donation payment', 
        isLoading: false 
      });
      return null;
    }
  },
  
  setCheckoutSuccess: (sessionId, amount, items) => {
    set({ 
      lastSuccessfulPayment: { sessionId, amount, items },
      cartItems: [], // Clear cart on successful payment
      checkoutSessionId: null,
      checkoutUrl: null
    });
  },
  
  reset: () => {
    set({
      cartItems: [],
      isLoading: false,
      error: null,
      checkoutSessionId: null,
      checkoutUrl: null,
      lastSuccessfulPayment: null
    });
  }
}), {
  name: 'checkout-store',
  partialize: (state) => ({
    cartItems: state.cartItems,
    lastSuccessfulPayment: state.lastSuccessfulPayment
  }),
}));
