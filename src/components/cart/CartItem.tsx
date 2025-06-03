import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useCampaignStore } from '../../stores/campaignStore';
import { CartItem as CartItemType, DonationCampaign } from '../../types/index';

// Import icons - you might need to install these packages first
// npm install lucide-react
import { Trash2, Plus, Minus, RefreshCcw } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart, setProductCampaign } = useCartStore();
  const { getCampaignById, getActiveCampaigns } = useCampaignStore();
  const { product, quantity } = item;
  
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(!!product.campaignId);
  const [showCampaignSelector, setShowCampaignSelector] = useState(!product.campaignId);
  const [activeCampaigns, setActiveCampaigns] = useState<DonationCampaign[]>([]);
  
  // Fetch active campaigns for the selector
  useEffect(() => {
    if (showCampaignSelector) {
      const loadActiveCampaigns = async () => {
        try {
          const campaigns = await getActiveCampaigns();
          setActiveCampaigns(campaigns);
        } catch (error) {
          console.error('Error loading active campaigns:', error);
        }
      };
      
      loadActiveCampaigns();
    }
  }, [showCampaignSelector, getActiveCampaigns]);
  
  // Fetch campaign information if a campaignId is present
  useEffect(() => {
    const fetchCampaign = async () => {
      if (product.campaignId) {
        console.log(`CartItem: Fetching campaign for ID: ${product.campaignId}`);
        setIsLoadingCampaign(true);
        try {
          // First try to get campaign from the store
          const campaignData = await getCampaignById(product.campaignId);
          console.log('CartItem: Campaign data:', campaignData);
          
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
      console.log(`CartItem: Product has campaignId: ${product.campaignId}`);
      fetchCampaign();
    } else {
      console.log('CartItem: Product does not have a campaignId');
      setCampaign(null);
    }
  }, [product.campaignId, getCampaignById]);
  
  const handleIncrease = () => {
    updateQuantity(product.id, quantity + 1);
  };
  
  const handleDecrease = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    }
  };
  
  const handleRemove = () => {
    removeFromCart(product.id);
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
  
  const handleChangeCampaign = () => {
    setShowCampaignSelector(true);
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
        {/* Campaign information section */}
        <div className="mt-1">
          {/* Add debug info (hidden) */}
          <div style={{display: 'none'}} className="text-xs text-gray-400">
            Campaign ID: {product.campaignId}<br/>
            Is Royal Mission: {product.campaignId?.includes("Royal") ? 'Yes' : 'No'}<br/>
            Loading: {isLoadingCampaign ? 'Yes' : 'No'}<br/>
            Has Campaign Data: {campaign ? 'Yes' : 'No'}
          </div>
          
          {isLoadingCampaign ? (
            <p className="text-sm text-gray-500 mt-1">
              <span className="inline-block animate-spin mr-1"><RefreshCcw size={12} /></span>
              Loading campaign information...
            </p>
          ) : product.campaignId ? (
            <div className="flex items-center mt-1">
              <p className="text-sm text-[#FF4B26] mr-2">
                {campaign ? (
                  <>Supporting: {campaign.title}</>
                ) : (
                  // Fallback when campaign data isn't loaded but we have the ID
                  <>Supporting: {product.campaignId === "13036403-b957-402a-8786-669f74171ebd" ?
                    "Royal Mission School – Sifra Bachtiar" :
                    `Campaign ${product.campaignId.substring(0, 8)}...`
                  }</>
                )}
              </p>
              <button 
                onClick={handleChangeCampaign}
                className="text-xs text-gray-500 hover:text-[#FF4B26] underline"
              >
                Change
              </button>
            </div>
          ) : showCampaignSelector ? (
            <div className="mt-2 border-t border-gray-100 pt-2">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Donate to a campaign (optional)</h4>
              {activeCampaigns.length > 0 ? (
                <select
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4B26] focus:border-[#FF4B26]"
                  onChange={(e) => handleCampaignSelected(e.target.value)}
                  value={product.campaignId || ""}
                >
                  <option value="">Select a campaign</option>
                  {activeCampaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">
                  There are currently no active campaigns available
                </p>
              )}
              <button 
                onClick={() => setShowCampaignSelector(false)}
                className="text-xs text-gray-500 hover:text-gray-700 mt-1 underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowCampaignSelector(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline mt-1"
            >
              Donate to a campaign (optional)
            </button>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Category: {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </p>
      </div>
      
      <div className="flex items-center mt-3 sm:mt-0">
        <div className="flex items-center border border-gray-200 rounded-md">
          <button
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className={`p-1 ${quantity <= 1 ? 'text-gray-300' : 'text-gray-500 hover:text-[#FF4B26]'}`}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          
          <span className="px-3 py-1 text-gray-700">
            {quantity}
          </span>
          
          <button
            onClick={handleIncrease}
            className="p-1 text-gray-500 hover:text-[#FF4B26]"
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      <div className="font-medium text-[#FF4B26] min-w-[80px] text-right ml-6">
        €{(product.price * quantity).toFixed(2)}
      </div>
      
      <button
        onClick={handleRemove}
        className="text-gray-400 hover:text-[#FF4B26] p-1 ml-3"
        aria-label="Remove item"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default CartItem;
