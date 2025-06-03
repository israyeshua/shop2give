import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuth } from './auth';
import { CampaignDonation, CampaignStatistics } from './types';
import { SupabaseCampaignsService, Campaign as APICampaign } from '../api/supabase/campaigns';
import { SupabaseDonationsService } from '../api/supabase/donations';

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string; // Maps to main_image_url
  goalAmount: number; // Maps to goal_amount
  currentAmount: number; // Maps to current_amount
  startDate: string; // Maps to start_date
  endDate: string | null; // Maps to end_date
  ownerId: string; // Maps to campaign_manager_id
  ownerName?: string;
  categoryId?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string; // Maps to created_at
  updatedAt: string; // Maps to updated_at
  galleryImages?: string[];
};

// Utility function to convert API Campaign to UI Campaign
const mapApiCampaignToUICampaign = (apiCampaign: APICampaign): Campaign => {
  return {
    id: apiCampaign.id,
    slug: apiCampaign.slug,
    title: apiCampaign.title,
    description: apiCampaign.description,
    imageUrl: apiCampaign.main_image_url,
    goalAmount: apiCampaign.goal_amount,
    currentAmount: apiCampaign.current_amount,
    startDate: apiCampaign.start_date,
    endDate: apiCampaign.end_date,
    ownerId: apiCampaign.campaign_manager_id,
    ownerName: undefined, // Would need to fetch from user data
    status: 'active', // Default status based on deleted_at being null
    createdAt: apiCampaign.created_at,
    updatedAt: apiCampaign.updated_at,
    categoryId: undefined,
  };
};

// Utility function to convert UI Campaign to API Campaign format
const mapUICampaignToApiCampaign = (uiCampaign: Partial<Campaign>): Partial<APICampaign> => {
  const result: Partial<APICampaign> = {};
  
  if (uiCampaign.id !== undefined) result.id = uiCampaign.id;
  if (uiCampaign.slug !== undefined) result.slug = uiCampaign.slug;
  if (uiCampaign.title !== undefined) result.title = uiCampaign.title;
  if (uiCampaign.description !== undefined) result.description = uiCampaign.description;
  if (uiCampaign.imageUrl !== undefined) result.main_image_url = uiCampaign.imageUrl;
  if (uiCampaign.goalAmount !== undefined) result.goal_amount = uiCampaign.goalAmount;
  if (uiCampaign.currentAmount !== undefined) result.current_amount = uiCampaign.currentAmount;
  if (uiCampaign.startDate !== undefined) result.start_date = uiCampaign.startDate;
  if (uiCampaign.endDate !== undefined) result.end_date = uiCampaign.endDate;
  if (uiCampaign.ownerId !== undefined) result.campaign_manager_id = uiCampaign.ownerId;
  if (uiCampaign.createdAt !== undefined) result.created_at = uiCampaign.createdAt;
  if (uiCampaign.updatedAt !== undefined) result.updated_at = uiCampaign.updatedAt;
  
  return result;
};

type CampaignState = {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  campaignDonations: CampaignDonation[];
  campaignStats: CampaignStatistics | null;
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  fetchCampaignById: (id: string) => Promise<void>;
  fetchCampaignDonations: (campaignId: string) => Promise<void>;
  fetchCampaignStatistics: (campaignId: string) => Promise<void>;
  createCampaign: (campaign: Partial<Campaign>) => Promise<Campaign>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  createDonation: (donation: Omit<CampaignDonation, 'id' | 'createdAt'>) => Promise<string | null>;
  resetError: () => void;
  getActiveCampaigns: () => Promise<Campaign[]>;
  getCampaignById: (id: string) => Promise<Campaign | undefined>;
};

export const useCampaigns = create<CampaignState>()(persist((set, get) => ({
  campaigns: [],
  activeCampaign: null,
  campaignDonations: [],
  campaignStats: null,
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true });
    try {
      const apiCampaigns = await SupabaseCampaignsService.getAllCampaigns();
      // Convert API campaigns to UI campaigns
      const campaigns = apiCampaigns.map(apiCampaign => mapApiCampaignToUICampaign(apiCampaign));
      set({ campaigns, isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchCampaignById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const apiCampaign = await SupabaseCampaignsService.getCampaignById(id);
      
      if (!apiCampaign) {
        throw new Error(`Campaign with ID: ${id} not found`);
      }
      
      // Convert API campaign to UI campaign
      const campaign = mapApiCampaignToUICampaign(apiCampaign);
      
      set({ 
        activeCampaign: campaign, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch campaign with ID: ${id}`, 
        isLoading: false 
      });
    }
  },
  
  fetchCampaignDonations: async (campaignId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const donations = await SupabaseDonationsService.getDonationsByCampaign(campaignId);
      
      set({ 
        campaignDonations: donations as CampaignDonation[], 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch donations for campaign: ${campaignId}`, 
        isLoading: false 
      });
    }
  },
  
  fetchCampaignStatistics: async (campaignId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const statistics = await SupabaseDonationsService.getCampaignStatistics(campaignId);
      
      if (!statistics) {
        throw new Error(`Statistics for campaign: ${campaignId} not found`);
      }
      
      set({ 
        campaignStats: statistics as CampaignStatistics, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch statistics for campaign: ${campaignId}`, 
        isLoading: false 
      });
    }
  },

  createCampaign: async (campaign) => {
    try {
      set({ isLoading: true, error: null });
      
      const user = useAuth.getState().user;
      if (!user) throw new Error('Must be logged in to create a campaign');

      // Ensure we use the correct field name for the owner and convert to API format
      const newCampaign = {
        ...campaign,
        ownerId: user.id,
      };

      // Convert to API campaign format
      const apiCampaignData = mapUICampaignToApiCampaign(newCampaign);
      
      // Create the campaign
      const createdApiCampaign = await SupabaseCampaignsService.createCampaign(apiCampaignData);
      
      // Convert back to UI format
      const createdCampaign = mapApiCampaignToUICampaign(createdApiCampaign);
      
      const campaigns = get().campaigns;
      set({ campaigns: [createdCampaign, ...campaigns], isLoading: false });
      
      return createdCampaign;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  createDonation: async (donation: Omit<CampaignDonation, 'id' | 'createdAt'>) => {
    try {
      set({ isLoading: true, error: null });
      
      // Add createdAt field and handle type compatibility (convert undefined to null for nullable fields)
      const donationWithCreatedAt = {
        ...donation,
        createdAt: new Date().toISOString(),
        // Convert undefined fields to null to match API expectations
        donorId: donation.donorId || null,
        donorName: donation.donorName || null,
        donorEmail: donation.donorEmail || null,
        message: donation.message || null
      };
      
      const donationId = await SupabaseDonationsService.createDonation(donationWithCreatedAt);
      
      set({ isLoading: false });
      return donationId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create donation', 
        isLoading: false 
      });
      return null;
    }
  },

  updateCampaign: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      // Convert UI campaign updates to API format
      const apiUpdates = mapUICampaignToApiCampaign(updates);

      await SupabaseCampaignsService.updateCampaign(id, apiUpdates);

      // Refresh the active campaign if we're updating it
      if (get().activeCampaign?.id === id) {
        await get().fetchCampaignById(id);
      }

      const campaigns = get().campaigns.map(c => 
        c.id === id ? { ...c, ...updates } : c
      );

      set({ campaigns, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to update campaign: ${id}`, 
        isLoading: false 
      });
    }
  },

  deleteCampaign: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await SupabaseCampaignsService.deleteCampaign(id);

      const campaigns = get().campaigns.filter(c => c.id !== id);
      set({ campaigns, isLoading: false });
      
      // If we just deleted the active campaign, clear it
      if (get().activeCampaign?.id === id) {
        set({ activeCampaign: null });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to delete campaign: ${id}`, 
        isLoading: false 
      });
    }
  },
  
  resetError: () => {
    set({ error: null });
  },
  
  // Get active campaigns (fetches if not already loaded)
  getActiveCampaigns: async () => {
    const campaigns = get().campaigns;
    if (campaigns.length > 0) return campaigns;
    
    await get().fetchCampaigns();
    return get().campaigns;
  },
  
  // Get a campaign by ID
  getCampaignById: async (id: string) => {
    const campaigns = get().campaigns;
    const foundCampaign = campaigns.find(c => c.id === id);
    
    if (foundCampaign) return foundCampaign;
    
    // If not found in state, try to fetch it
    await get().fetchCampaignById(id);
    return get().activeCampaign || undefined;
  }
}), {
  name: 'campaigns-store',
  partialize: (state) => ({
    campaigns: state.campaigns,
    activeCampaign: state.activeCampaign,
    campaignStats: state.campaignStats
  }),
}));