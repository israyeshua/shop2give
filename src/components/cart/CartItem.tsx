import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useCampaignStore } from '../../stores/campaignStore';
import { CartItem as CartItemType, DonationCampaign } from '../../types/index';
import { Trash2, Plus, Minus, RefreshCcw, ChevronDown } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart, setProductCampaign } = useCartStore();
  const { getCampaignById, getActiveCampaigns } = useCampaignStore();
  const { product, quantity } = item;
  
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(!!product.campaignId);
  const [showCampaignSelector, setShowCampaignSelector] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<DonationCampaign[]>([]);
  
  useEffect(() => {
    const loadActiveCampaigns = async () => {
      try {
        const campaigns = await getActiveCampaigns();
        setActiveCampaigns(campaigns);
      } catch (error) {
        console.error('Error loading active campaigns:', error);
      }
    };
    
    loadActiveCampaigns();
  }, [getActiveCampaigns]);
  
  useEffect(() => {
    const fetchCampaign = async () => {
      if (product.campaignId) {
        setIsLoadingCampaign(true);
        try {
          const campaignData = await getCampaignById(product.campaignId);
          if (campaignData) {
            setCampaign(campaignData);
          }
        } catch (error) {
          console.error('Error fetching campaign:', error);
        } finally {
          setIsLoadingCampaign(false);
        }
      }
    };
    
    if (product.campaignId) {
      fetchCampaign();
    } else {
      setCampaign(null);
    }
  }, [product.campaignId, getCampaignById]);
  
  const handleIncrease = () => {
    updateQuantity(product.id, quantity + 1, product.campaignId);
  };
  
  const handleDecrease = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1, product.campaignId);
    }
  };
  
  const handleRemove = () => {
    removeFromCart(product.id, product.campaignId);
  };

  const handleCampaignSelected = (campaignId: string) => {
    setIsLoadingCampaign(true);
    setProductCampaign(product.id, campaignId);
    
    getCampaignById(campaignId).then(selectedCampaign => {
      if (selectedCampaign) {
        setCampaign(selectedCampaign);
      }
      setShowCampaignSelector(false);
      setIsLoadingCampaign(false);
    }).catch(() => {
      setIsLoadingCampaign(false);
    });
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center py-4 border-b border-gray-100">
      <a href={`/product/${product.id}`} className="flex-shrink-0 mr-4 w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </a>
      
      <div className="flex-grow py-2">
        <a href={`/product/${product.id}`} className="font-medium text-[#002B4E] hover:text-[#FF4B26] transition-colors">
          {product.name}
        </a>
        
        <div className="mt-2">
          {isLoadingCampaign ? (
            <p className="text-sm text-gray-500">
              <RefreshCcw className="inline-block animate-spin mr-1 h-4 w-4" />
              Loading campaign...
            </p>
          ) : (
            <div className="relative">
              {product.campaignId ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-brand-teal">
                    Supporting: {campaign?.title || 'Loading...'}
                  </span>
                  <button 
                    onClick={() => setShowCampaignSelector(!showCampaignSelector)}
                    className="text-sm text-gray-500 hover:text-brand-teal flex items-center"
                  >
                    Change
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowCampaignSelector(!showCampaignSelector)}
                  className="text-sm text-brand-teal hover:text-brand-teal-dark flex items-center"
                >
                  Add to campaign
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
              )}
              
              {showCampaignSelector && (
                <div className="absolute z-10 mt-2 w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Select a campaign to support
                    </h4>
                    <div className="space-y-2">
                      {activeCampaigns.map(campaign => (
                        <button
                          key={campaign.id}
                          onClick={() => handleCampaignSelected(campaign.id)}
                          className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm"
                        >
                          {campaign.title}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowCampaignSelector(false)}
                      className="mt-3 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center mt-3 sm:mt-0">
        <div className="flex items-center border border-gray-200 rounded-md">
          <button
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className={`p-1 ${quantity <= 1 ? 'text-gray-300' : 'text-gray-500 hover:text-brand-teal'}`}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          
          <span className="px-3 py-1 text-gray-700">
            {quantity}
          </span>
          
          <button
            onClick={handleIncrease}
            className="p-1 text-gray-500 hover:text-brand-teal"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="font-medium text-brand-teal min-w-[80px] text-right ml-6">
        €{(product.price * quantity).toFixed(2)}
      </div>
      
      <button
        onClick={handleRemove}
        className="text-gray-400 hover:text-brand-teal p-1 ml-3"
        aria-label="Remove item"
      >
        <Trash2 className="h-4.5 w-4.5" />
      </button>
    </div>
  );
};

export default CartItem;