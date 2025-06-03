import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
import { StripeService } from '../api/stripe/payments';
import { useCartStore } from '../stores/cartStore';
import CartItem from '../components/cart/CartItem';

export function CartPage() {
  const { items, getTotalPrice } = useCartStore();
  const total = getTotalPrice();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // Format cart items to match what StripeService expects
      // This format needs to match the CartItem interface in api/stripe/payments.ts
      const cartItems = items.map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          priceId: item.product.priceId || item.product.id, // Use priceId if available, fallback to id
          campaignId: item.product.campaignId
        },
        quantity: item.quantity
      }));
      
      // Get campaign ID from the first item (if any)
      const campaignId = items[0]?.product?.campaignId || '';
      
      // Call StripeService to create and redirect to checkout
      // Note: this will redirect the user to Stripe's checkout page
      await StripeService.createCheckoutSession(
        cartItems,
        undefined, // Email is optional
        campaignId, // Now guaranteed to be a string (empty string if undefined)
        `${window.location.origin}/success`,
        `${window.location.origin}/cancel`
      );
      
      // This code won't execute because the above redirects to Stripe
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-16">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="mb-8 text-gray-600">Add some products to get started!</p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-2xl font-bold text-gray-900">Shopping Cart</h1>
          
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg bg-white p-4 shadow-sm">
                    <CartItem item={item} />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Order Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing Fee</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-medium text-gray-900">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  className="mt-6 w-full"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}