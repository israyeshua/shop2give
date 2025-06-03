import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SupabaseDonationsService, CampaignStatistics } from '../api/supabase/donations';

export interface Donation {
  id: string;
  campaignId: string;
  donorId: string | null;
  amount: number;
  donorName: string | null;
  donorEmail: string | null;
  message: string | null;
  isAnonymous: boolean;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
};

export interface DonationState {
  donations: Donation[];
  campaignDonations: Donation[];
  campaignStatistics: CampaignStatistics | null;
  currentCampaignId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchDonations: (campaignId?: string) => Promise<Donation[]>;
  fetchDonationById: (id: string) => Promise<Donation | null>;
  fetchDonationsByCampaign: (campaignId: string) => Promise<Donation[]>;
  fetchDonationsByDonor: (donorId: string) => Promise<Donation[]>;
  fetchCampaignStatistics: (campaignId: string) => Promise<CampaignStatistics | null>;
  fetchRecentDonations: (limit?: number) => Promise<Donation[]>;
  createDonation: (donation: Partial<Donation>) => Promise<string | null>;
  updateDonationStatus: (donationId: string, status: 'pending' | 'completed' | 'failed') => Promise<void>;
  setCurrentCampaignId: (campaignId: string | null) => void;
  reset: () => void;
};

export const useDonations = create<DonationState>()(persist((set, get) => ({
  donations: [],
  campaignDonations: [],
  campaignStatistics: null,
  currentCampaignId: null,
  isLoading: false,
  error: null,

  fetchDonations: async (campaignId) => {
    set({ isLoading: true });
    try {
      let donations: Donation[];
      
      if (campaignId) {
        donations = await SupabaseDonationsService.getDonationsByCampaign(campaignId);
        set({ campaignDonations: donations, currentCampaignId: campaignId });
      } else {
        donations = await SupabaseDonationsService.getRecentDonations(50);
      }
      
      set({ donations, isLoading: false, error: null });
      return donations;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },
  
  fetchDonationById: async (id: string) => {
    set({ isLoading: true });
    try {
      const donation = await SupabaseDonationsService.getDonationById(id);
      set({ isLoading: false, error: null });
      return donation;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },
  
  fetchDonationsByCampaign: async (campaignId: string) => {
    set({ isLoading: true, currentCampaignId: campaignId });
    try {
      const donations = await SupabaseDonationsService.getDonationsByCampaign(campaignId);
      set({ campaignDonations: donations, isLoading: false, error: null });
      return donations;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },
  
  fetchDonationsByDonor: async (donorId: string) => {
    set({ isLoading: true });
    try {
      const donations = await SupabaseDonationsService.getDonationsByDonor(donorId);
      set({ isLoading: false, error: null });
      return donations;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },
  
  fetchCampaignStatistics: async (campaignId: string) => {
    set({ isLoading: true });
    try {
      const statistics = await SupabaseDonationsService.getCampaignStatistics(campaignId);
      set({ campaignStatistics: statistics, isLoading: false, error: null });
      return statistics;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },
  
  fetchRecentDonations: async (limit = 10) => {
    set({ isLoading: true });
    try {
      const donations = await SupabaseDonationsService.getRecentDonations(limit);
      set({ donations, isLoading: false, error: null });
      return donations;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },

  createDonation: async (donation) => {
    set({ isLoading: true });
    try {
      const donationId = await SupabaseDonationsService.createDonation(donation as Omit<Donation, 'id'>);
      
      // If we were showing the same campaign donations, update our list
      if (donationId && donation.campaignId === get().currentCampaignId) {
        // Fetch the donation we just created to add to the list
        const newDonation = await SupabaseDonationsService.getDonationById(donationId);
        if (newDonation) {
          const campaignDonations = get().campaignDonations;
          set({ campaignDonations: [newDonation, ...campaignDonations] });
        }
      }
      
      set({ isLoading: false, error: null });
      return donationId;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  updateDonationStatus: async (donationId, status) => {
    set({ isLoading: true });
    try {
      await SupabaseDonationsService.updateDonationStatus(donationId, status);
      
      // Update donation in our lists if present
      const donations = get().donations.map(d => 
        d.id === donationId ? { ...d, paymentStatus: status } : d
      );
      
      const campaignDonations = get().campaignDonations.map(d => 
        d.id === donationId ? { ...d, paymentStatus: status } : d
      );
      
      set({ donations, campaignDonations, isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  setCurrentCampaignId: (campaignId) => {
    set({ currentCampaignId: campaignId });
  },
  
  reset: () => {
    set({ 
      donations: [], 
      campaignDonations: [], 
      campaignStatistics: null, 
      currentCampaignId: null, 
      isLoading: false, 
      error: null 
    });
  },
}), {
  name: 'donations-store',
  partialize: (state) => ({
    donations: state.donations,
    campaignDonations: state.campaignDonations,
    campaignStatistics: state.campaignStatistics,
    currentCampaignId: state.currentCampaignId
  }),
}));