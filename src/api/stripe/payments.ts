import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../../lib/supabase';

// Initialize environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('Missing Stripe environment variables');
  throw new Error('Missing environment variable: VITE_STRIPE_PUBLISHABLE_KEY');
}

// Define our own CartItem interface to avoid import issues
// This matches the structure from cart.ts but avoids potential circular dependencies
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  priceId: string;
  campaignId?: string;
  // Stripe-specific fields added to match data/products.ts
  stripeProductId?: string;
  stripePriceId?: string;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

// Load Stripe
let stripePromise: Promise<Stripe | null>;

// Interface for the checkout payload
interface CheckoutPayload {
  product_id?: string; // New field for product lookup
  price_id?: string;  // Now optional since we might use product_id
  success_url: string;
  cancel_url: string;
  mode: string;
  email?: string; // Optional for anonymous checkout
}

/**
 * Stripe Payments service for handling payment-related operations
 */
export class StripeService {
  /**
   * Initialize Stripe
   */
  static getStripe() {
    if (!stripePromise) {
      stripePromise = loadStripe(stripePublishableKey);
    }
    return stripePromise;
  }

  /**
   * Create checkout session with Stripe and redirect to checkout
   * 
   * Note: This method adapts our cart items to work with the Supabase function API
   * The Supabase function expects a single price_id, not multiple line items.
   * 
   * @param items - Cart items to checkout with (currently only uses first item's priceId)
   * @param email - Customer email for anonymous checkout
   * @param campaignId - Optional campaign ID (not currently used by the Supabase function)
   * @param customSuccessUrl - Optional custom success URL
   * @param customCancelUrl - Optional custom cancel URL
   */
  static async createCheckoutSession(
    items: CartItem[],
    email: string,
    _campaignId?: string, // Prefixed with _ to indicate it's intentionally unused
    customSuccessUrl?: string,
    customCancelUrl?: string
  ) {
    try {
      // Initialize Stripe
      const stripe = await this.getStripe();
      if (!stripe) {
        throw new Error('Stripe initialization failed');
      }

      // Get base URL for success/cancel redirects
      const baseUrl = window.location.origin;
      
      // Set success and cancel URLs with fallbacks
      const success_url = customSuccessUrl || `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = customCancelUrl || `${baseUrl}/checkout/canceled`;
      
      // IMPORTANT: Our Supabase function only supports a single price_id, not multiple line items
      if (!items || items.length === 0) {
        throw new Error('No items in cart');
      }
      
      const firstItem = items[0];
      
      if (!firstItem || !firstItem.product || !firstItem.product.priceId) {
        console.error('No items in cart or missing priceId on first item:', items);
        throw new Error('No items in cart or missing priceId');
      }
      
      // Get the Stripe product ID from the product if available
      const stripeProductId = firstItem.product.stripeProductId || 'prod_SPOVEmUgAGR6ez';
      
      // Instead of using a hardcoded price, we'll use the Supabase function to look up pricing
      // The Supabase function will look up the product and use its default price
      const useProductLookup = true; // Set to true to have the server look up the product
      
      // If we're using product lookup, pass the product ID instead of a price ID
      // The serverless function will look up the product and use its default price
      const stripePriceId = useProductLookup ? '' : (firstItem.product.stripePriceId || '');
      
      // For debugging
      console.log('Checkout details:', {
        productId: firstItem.product.id,
        productName: firstItem.product.name,
        stripeProductId,
        quantity: firstItem.quantity,
        email: email || 'Not provided'
      });
      
      // The mode parameter required by the Supabase function
      const mode = 'payment'; // Default to one-time payment (not subscription)
      
      console.log('Sending payload to Supabase:', JSON.stringify({
        product_id: stripeProductId,
        success_url,
        cancel_url,
        mode
      }));
      
      console.log(`Using Stripe price ID ${stripePriceId} for product ${firstItem.product.id}`);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session?.user;
      
      console.log(`User is ${isAuthenticated ? 'authenticated' : 'anonymous'}, proceeding with checkout`);
      
      // Prepare payload for the Supabase function
      const payload: CheckoutPayload = {
        // Only include product_id (not price_id) to use the product lookup approach
        product_id: stripeProductId,
        success_url,
        cancel_url,
        mode
      };
      
      // Important: Don't pass a price_id at all when using product_id
      
      // Add email for anonymous checkout if available
      if (!isAuthenticated && email) {
        payload.email = email;
      }
      
      console.log('Sending payload to Supabase function:', payload);
      
      // Choose appropriate function based on authentication status
      const functionName = isAuthenticated ? 'stripe-checkout' : 'stripe-anonymous-checkout';
      
      try {
        console.log(`Invoking ${functionName} function...`);
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload
        });
          
        if (error) {
          console.error('Supabase function error:', error);
          
          // If authenticated checkout fails, try anonymous checkout as fallback
          if (isAuthenticated && error.message?.includes('auth')) {
            console.log('Authentication-based checkout failed. Trying anonymous checkout...');
            return await this.tryAnonymousCheckout(payload, stripe);
          }
          
          throw new Error(`Stripe checkout error: ${error.message || JSON.stringify(error)}`);
        }
        
        if (!data) {
          throw new Error('No data returned from checkout function');
        }
        
        console.log('Checkout session created:', data);
        
        // Handle redirect URLs
        const checkoutUrl = data.url || data.checkoutUrl;
        
        if (checkoutUrl) {
          // Direct redirect to Stripe checkout
          console.log('Redirecting to Stripe checkout:', checkoutUrl);
          window.location.href = checkoutUrl;
          return { success: true };
        }
        
        // If we have a session ID but no URL, redirect via Stripe.js
        if (data.id) {
          console.log('Redirecting to Stripe checkout with session ID:', data.id);
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.id
          });
          
          if (error) {
            console.error('Stripe redirect error:', error);
            throw new Error(`Redirect to checkout failed: ${error.message}`);
          }
          
          return { success: true };
        }
        
        throw new Error('Invalid response from checkout function: missing URL and session ID');
      } catch (err: any) {
        // If authenticated checkout fails for any reason, try anonymous checkout as fallback
        if (isAuthenticated && !err.message?.includes('already tried anonymous')) {
          console.log('Error during authenticated checkout, falling back to anonymous checkout:', err);
          try {
            return await this.tryAnonymousCheckout(payload, stripe);
          } catch (anonError: any) {
            console.error('Anonymous checkout also failed:', anonError);
            throw new Error(`Checkout failed: ${anonError.message || anonError}`);
          }
        }
        
        throw err;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error during checkout' 
      };
    }
  }

  /**
   * Try anonymous checkout as a fallback method
   * 
   * @param payload - The checkout payload
   * @param stripe - Initialized Stripe instance
   */
  static async tryAnonymousCheckout(payload: CheckoutPayload, stripe: Stripe) {
    console.log('Attempting anonymous checkout with payload:', payload);
    
    // Mark that we've already tried anonymous checkout to avoid infinite loops
    const errorContext = 'already tried anonymous checkout';
    
    try {
      const { data, error } = await supabase.functions.invoke('stripe-anonymous-checkout', {
        body: payload
      });
      
      if (error) {
        throw new Error(`Anonymous checkout failed: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data) {
        throw new Error('No data returned from anonymous checkout function');
      }
      
      // Handle direct URL or session ID
      const checkoutUrl = data.url || data.checkoutUrl;
      
      if (checkoutUrl) {
        // Direct redirect to Stripe checkout
        console.log('Redirecting to anonymous Stripe checkout:', checkoutUrl);
        window.location.href = checkoutUrl;
        return { success: true };
      }
      
      // If we have a session ID but no URL, redirect via Stripe.js
      if (data.id) {
        console.log('Redirecting to anonymous Stripe checkout with session ID:', data.id);
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.id
        });
        
        if (error) {
          throw new Error(`Redirect to checkout failed: ${error.message}`);
        }
        
        return { success: true };
      }
      
      throw new Error('Invalid response from anonymous checkout: missing URL and session ID');
    } catch (error: any) {
      console.error('Anonymous checkout error:', error);
      // Add context to prevent infinite loops
      error.message = `${error.message} (${errorContext})`;
      throw error;
    }
  }
}

// Export the createCheckoutSession function directly for easier imports
export const createCheckoutSession = StripeService.createCheckoutSession;
