import React from 'react';
import { useCartStore } from '../../stores/cartStore';
import CartItem from './CartItem';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../../api/stripe/payments';

const Cart: React.FC = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    try {
      // Get user's email - in a real implementation, you would get this from your auth system
      const userEmail = 'anonymous@example.com'; // Placeholder email for anonymous checkout
      
      // Create a checkout session with the items and email
      // The function will internally handle both authenticated and anonymous checkout flows
      await createCheckoutSession(items, userEmail);

      // Note: The createCheckoutSession function handles the redirection internally
      // so we don't need to do anything with the result
      console.log('Checkout session created, redirecting to Stripe');
    } catch (error) {
      console.error('Error during checkout:', error);
      // In a real implementation, you would show an error message to the user
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-6">Looks like you haven't added any products to your cart yet.</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-[#FF4B26] text-white py-2 px-6 rounded hover:bg-[#E63E1C] transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
        <button
          onClick={clearCart}
          className="text-gray-500 hover:text-red-500 text-sm underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Subtotal ({getTotalItems()} items):</span>
          <span className="font-semibold">€{getTotalPrice().toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Shipping:</span>
          <span className="font-semibold">Free</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total:</span>
          <span className="text-[#FF4B26]">€{getTotalPrice().toFixed(2)}</span>
        </div>

        <div className="mt-6">
          <button
            onClick={handleCheckout}
            className="w-full bg-[#FF4B26] text-white py-3 px-6 rounded-md hover:bg-[#E63E1C] transition-colors"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
