import { supabase } from '../../lib/supabase';

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
}

export interface CampaignStatistics {
  campaignId: string;
  title: string;
  goalAmount: number;
  currentAmount: number;
  totalDonations: number;
  highestDonation: number;
  averageDonation: number;
}

/**
 * Service for Supabase donation operations
 */
export class SupabaseDonationsService {
  /**
   * Creates a new donation
   */
  static async createDonation(donation: Omit<Donation, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_donations')
        .insert([donation])
        .select()
        .single();
      
      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating donation:', error);
      throw error;
    }
  }

  /**
   * Fetches all donations for a campaign
   */
  static async getDonationsByCampaign(campaignId: string): Promise<Donation[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_donations')
        .select('*')
        .eq('campaignId', campaignId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching donations for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches donations made by a specific donor
   */
  static async getDonationsByDonor(donorId: string): Promise<Donation[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_donations')
        .select('*')
        .eq('donorId', donorId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching donations for donor ${donorId}:`, error);
      throw error;
    }
  }

  /**
   * Updates the payment status of a donation
   */
  static async updateDonationStatus(
    donationId: string, 
    paymentStatus: 'pending' | 'completed' | 'failed'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaign_donations')
        .update({ paymentStatus })
        .eq('id', donationId);
      
      if (error) throw error;

      // If donation is completed, update campaign amount
      if (paymentStatus === 'completed') {
        // Get the donation amount and campaign ID
        const { data: donation, error: donationError } = await supabase
          .from('campaign_donations')
          .select('amount, campaignId')
          .eq('id', donationId)
          .single();
        
        if (donationError) throw donationError;

        // Get current campaign amount
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select('current_amount')
          .eq('id', donation?.campaignId)
          .single();
        
        if (campaignError) throw campaignError;

        // Update campaign amount
        const newAmount = (campaign?.current_amount || 0) + (donation?.amount || 0);
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ current_amount: newAmount })
          .eq('id', donation?.campaignId);
        
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error(`Error updating donation ${donationId} status:`, error);
      throw error;
    }
  }

  /**
   * Gets statistics for a campaign
   */
  static async getCampaignStatistics(campaignId: string): Promise<CampaignStatistics | null> {
    try {
      // First try to get from the statistics view/table if it exists
      const { data, error } = await supabase
        .from('campaign_statistics')
        .select('*')
        .eq('campaignId', campaignId)
        .single();
      
      if (!error && data) {
        return data;
      }
      
      // If no statistics view/table or no data, calculate statistics manually
      const { data: donations, error: donationsError } = await supabase
        .from('campaign_donations')
        .select('amount')
        .eq('campaignId', campaignId)
        .eq('paymentStatus', 'completed');
      
      if (donationsError) throw donationsError;
      
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('title, goal_amount, current_amount')
        .eq('id', campaignId)
        .single();
      
      if (campaignError) throw campaignError;
      
      if (!donations || !campaign) return null;
      
      // Calculate statistics
      const totalDonations = donations.length;
      const amounts = donations.map(d => d.amount);
      const highestDonation = amounts.length ? Math.max(...amounts) : 0;
      const averageDonation = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
      
      return {
        campaignId,
        title: campaign.title,
        goalAmount: campaign.goal_amount,
        currentAmount: campaign.current_amount,
        totalDonations,
        highestDonation,
        averageDonation
      };
    } catch (error) {
      console.error(`Error fetching statistics for campaign ${campaignId}:`, error);
      return null;
    }
  }

  /**
   * Gets a single donation by ID
   */
  static async getDonationById(id: string): Promise<Donation | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_donations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching donation ${id}:`, error);
      return null;
    }
  }

  /**
   * Gets recent donations across all campaigns
   */
  static async getRecentDonations(limit: number = 10): Promise<Donation[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_donations')
        .select('*')
        .eq('paymentStatus', 'completed')
        .order('createdAt', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent donations:', error);
      return [];
    }
  }
}
