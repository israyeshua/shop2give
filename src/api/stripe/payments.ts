import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../../lib/supabase';
import { CartItem, StripeLineItem } from '../../types';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing environment variable: VITE_STRIPE_PUBLISHABLE_KEY');
}

let stripePromise: Promise<Stripe | null>;

export class StripeService {
  static getStripe() {
    if (!stripePromise) {
      stripePromise = loadStripe(stripePublishableKey);
    }
    return stripePromise;
  }

  static async createCheckoutSession(
    items: CartItem[],
    email?: string,
    customSuccessUrl?: string,
    customCancelUrl?: string
  ) {
    try {
      const stripe = await this.getStripe();
      if (!stripe) {
        throw new Error('Stripe initialization failed');
      }

      const baseUrl = window.location.origin;
      const success_url = customSuccessUrl || `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = customCancelUrl || `${baseUrl}/cancel`;

      // Convert cart items to Stripe line items with metadata
      const line_items: StripeLineItem[] = items.map(item => ({
        price: item.product.priceId,
        quantity: item.quantity,
        metadata: {
          productId: item.product.id,
          campaignId: item.product.campaignId,
          donationPercentage: item.product.donationPercentage || 50, // Default to 50%
        },
      }));

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          line_items,
          success_url,
          cancel_url,
          email,
          mode: 'payment',
        },
      });

      if (error) throw error;

      const checkoutUrl = data.url || data.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return { success: true };
      }

      if (data.id) {
        const { error: redirectError } = await stripe.redirectToCheckout({
          sessionId: data.id,
        });

        if (redirectError) throw redirectError;
        return { success: true };
      }

      throw new Error('Invalid response from checkout function');
    } catch (error) {
      console.error('Checkout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during checkout'
      };
    }
  }

  static async getCheckoutSession(sessionId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-get-session', {
        body: { sessionId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }
}

export const createCheckoutSession = StripeService.createCheckoutSession;
export const getCheckoutSession = StripeService.getCheckoutSession;