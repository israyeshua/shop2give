import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

let stripePromise: Promise<any>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export const createCheckoutSession = async (
  priceId: string,
  mode: 'payment' | 'subscription' = 'payment',
  successUrl: string,
  cancelUrl: string,
) => {
  try {
    const stripe = await getStripe();
    const { error } = await stripe.redirectToCheckout({
      mode,
      lineItems: [{ price: priceId, quantity: 1 }],
      successUrl,
      cancelUrl,
    });

    if (error) throw error;
    return '';
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
};