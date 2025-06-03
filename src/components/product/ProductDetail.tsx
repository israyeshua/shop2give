import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Share2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, DonationCampaign } from '../../types/index';
import { useCartStore } from '../../stores/cartStore';
import { useCampaignStore } from '../../stores/campaignStore';

interface ProductDetailProps {
  product: Product;
}

const ProductDetail = ({ product }: ProductDetailProps): React.ReactNode => {
  const [quantity, setQuantity] = useState(1);
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  // Set Royal Mission School - Sifra Bachtiar as default campaign
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const { addToCart, items } = useCartStore();
  
  // Debug cart contents whenever it changes
  useEffect(() => {
    console.log('Current cart contents:', items);
    // Show cart count in console for debugging
    if (items && Array.isArray(items)) {
      console.log('Cart item count:', items.length);
    } else {
      console.warn('Cart items is not an array or is undefined:', items);
    }
  }, [items]);
  const { getActiveCampaigns } = useCampaignStore();
  
  // Fetch campaigns when the component mounts
  // Fetch campaigns from the database when component mounts
  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoadingCampaigns(true);
      try {
        // Fetch campaigns from the database
        const activeCampaigns = await getActiveCampaigns();
        console.log('Active campaigns for product:', activeCampaigns);
        setCampaigns(activeCampaigns || []);
        
        // Find Royal Mission School - Sifra Bachtiar campaign
        const royalMissionCampaign = activeCampaigns.find(campaign => 
          campaign.title.includes('Royal Mission School') || 
          campaign.title.includes('Sifra Bachtiar')
        );
        
        // Set as selected campaign if found
        if (royalMissionCampaign) {
          console.log('Royal Mission School found:', royalMissionCampaign.title);
          setSelectedCampaign(royalMissionCampaign.id);
        } else if (activeCampaigns.length > 0 && !selectedCampaign) {
          // Fallback to first campaign if Royal Mission not found
          console.log('Royal Mission School not found, selecting first campaign:', activeCampaigns[0].title);
          setSelectedCampaign(activeCampaigns[0].id);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [getActiveCampaigns, selectedCampaign]);
  
  // Pre-select campaign if product already has one
  useEffect(() => {
    if (product.campaignId) {
      setSelectedCampaign(product.campaignId);
    }
  }, [product.campaignId]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value));
  };
  
  const handleAddToCart = () => {
    try {
      // Log for debugging
      console.log('Adding product to cart:', product);
      console.log('Selected campaign:', selectedCampaign);
      console.log('Quantity:', quantity);
      
      // Ensure the product has the correct structure before adding to cart
      const productToAdd: Product = {
        ...product,
        campaignId: selectedCampaign || undefined,
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        // Pass Stripe information if available
        stripeProductId: product.stripeProductId,
        stripePriceId: product.stripePriceId
      };
      
      console.log('Product to add:', productToAdd);
      
      // Add to cart
      console.log('Before adding - Cart contains:', items.length, 'items');
      addToCart(productToAdd, quantity);
      
      // Set timeout to check cart after state update
      setTimeout(() => {
        console.log('After timeout - Cart contains:', items.length, 'items');
      }, 100);
      
      console.log('Product successfully added to cart');
    
      
      // Optionally navigate to cart
      // navigate('/cart');
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-4 md:p-6">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-auto object-cover rounded-lg"
          />
        </div>
        
        <div className="p-4 md:p-6 flex flex-col">
          <Link 
            to="/shop" 
            className="inline-flex items-center text-gray-500 hover:text-[#FF4B26] mb-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Shop
          </Link>
          
          <h1 className="text-2xl md:text-3xl font-serif font-medium text-[#002B4E] mb-2">
            {product.name}
          </h1>
          
          <p className="text-2xl text-[#FF4B26] font-medium mb-4">
            €{product.price.toFixed(2)}
          </p>
          
          <div className="mb-6">
            <p className="text-gray-600">
              {product.description}
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="quantity" className="block text-gray-700 mb-2">
              Quantity
            </label>
            <select
              id="quantity"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4B26] focus:border-transparent"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          {isLoadingCampaigns ? (
            <div className="mb-6">
              <p className="text-gray-500">Campagnes laden...</p>
            </div>
          ) : campaigns.length > 0 && (
            <div className="mb-6">
              <label htmlFor="campaign" className="block text-gray-700 mb-2">
                Donate to a campaign (optional)
              </label>
              <select
                id="campaign"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4B26] focus:border-transparent"
              >
                <option value="">Select a campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
              {selectedCampaign && (
                <p className="mt-2 text-sm text-gray-500">
                  A portion of the proceeds will go to the selected campaign
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <button 
              onClick={handleAddToCart}
              className="flex items-center justify-center bg-[#FF4B26] text-white py-2 px-4 rounded-md hover:bg-[#E63E1C] transition-colors"
            >
              <ShoppingCart size={18} className="mr-2" /> Add to Cart
            </button>
            
            <button 
              className="flex items-center justify-center bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Heart size={18} className="mr-2" /> Save for Later
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between">
              <button className="inline-flex items-center text-gray-500 hover:text-[#FF4B26] transition-colors">
                <Share2 size={16} className="mr-1" /> Share
              </button>
              
              {/* Debug button to check cart state */}
              <button 
                onClick={() => {
                  console.log('Current cart state:', items);
                  alert(`Current cart has ${items.length} items. Check console for details.`);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Check Cart ({items.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
