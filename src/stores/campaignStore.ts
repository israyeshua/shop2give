import { create } from 'zustand';
import { DonationCampaign } from '../types/index';
import { campaigns as dataCampaigns } from '../data/campaigns';

interface CampaignState {
  campaigns: DonationCampaign[];
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<DonationCampaign[]>;
  getActiveCampaigns: () => Promise<DonationCampaign[]>;
  getCampaignById: (id: string) => Promise<DonationCampaign | null>;
}

// Convert campaigns from data file to DonationCampaign type
const realCampaigns: DonationCampaign[] = dataCampaigns.map(campaign => ({
  id: campaign.id,
  title: campaign.title,
  description: campaign.description,
  imageUrl: campaign.imageUrl,
  goal: campaign.goal,
  raised: campaign.amountRaised,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  isLoading: false,
  error: null,
  
  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulating API call with a small delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({ campaigns: realCampaigns, isLoading: false });
      return realCampaigns;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaigns';
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },
  
  getActiveCampaigns: async () => {
    const campaigns = get().campaigns.length ? get().campaigns : await get().fetchCampaigns();
    return campaigns.filter(campaign => campaign.isActive);
  },
  
  getCampaignById: async (id: string) => {
    const campaigns = get().campaigns.length ? get().campaigns : await get().fetchCampaigns();
    return campaigns.find(campaign => campaign.id === id) || null;
  }
}));
