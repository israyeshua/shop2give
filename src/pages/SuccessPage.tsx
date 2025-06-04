import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/Button';
import { CheckCircle, Share2, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { formatCurrency } from '../lib/utils';

interface SessionDetails {
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    campaignId?: string;
    campaignName?: string;
  }>;
  total: number;
  customerEmail?: string;
}

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/checkout-sessions/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch session details');
        
        const data = await response.json();
        setSession(data);
        clearCart(); // Clear the cart after successful payment
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, clearCart]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-gray-50 py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-gray-50 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Verification Failed</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link to="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <div className="text-center mb-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Thank you for your purchase!
                </h1>
                <p className="text-gray-600">
                  Your payment has been processed successfully.
                  {session?.customerEmail && ` A confirmation email has been sent to ${session.customerEmail}`}
                </p>
              </div>

              {session && (
                <div className="space-y-6">
                  <div className="border-t border-b border-gray-200 py-6">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    <div className="space-y-4">
                      {session.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                              {item.campaignName && (
                                <span className="ml-2">• Supporting: {item.campaignName}</span>
                              )}
                            </p>
                          </div>
                          <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-xl text-brand-teal">
                          {formatCurrency(session.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        const text = "I just supported a great cause through Shop2Give!";
                        const url = window.location.origin;
                        window.open(
                          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                          '_blank'
                        );
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share on Twitter
                    </Button>
                    <Link to="/" className="flex-1">
                      <Button variant="secondary" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}