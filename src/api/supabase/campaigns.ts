import { supabase } from '../../lib/supabase';

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  main_image_url: string;
  goal_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string | null;
  campaign_manager_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Service for Supabase campaign operations
 */
export class SupabaseCampaignsService {
  /**
   * Fetches all campaigns
   */
  static async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * Fetches a single campaign by ID
   */
  static async getCampaignById(id: string): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching campaign with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a single campaign by slug
   */
  static async getCampaignBySlug(slug: string): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('slug', slug)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching campaign with slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new campaign
   */
  static async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaign])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Updates an existing campaign
   */
  static async updateCampaign(id: string, updates: Partial<Campaign>): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error updating campaign ${id}:`, error);
      throw error;
    }
  }

  /**
   * Soft deletes a campaign (sets deleted_at)
   */
  static async deleteCampaign(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting campaign ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets campaign donations
   */
  static async getCampaignDonations(campaignId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_donations')
        .select('*')
        .eq('campaignId', campaignId)
        .eq('paymentStatus', 'completed')
        .order('createdAt', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching donations for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Gets campaign statistics
   */
  static async getCampaignStatistics(campaignId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('campaign_statistics')
        .select('*')
        .eq('campaignId', campaignId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching statistics for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Creates a donation for a campaign
   */
  static async createDonation(donation: any): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_donations')
        .insert([donation])
        .select()
        .single();
        
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating donation:', error);
      throw error;
    }
  }

  /**
   * Links a product to a campaign
   */
  static async linkProductToCampaign(
    campaignId: string, 
    productId: string, 
    profitPercentage: number = 100
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaign_products')
        .insert([{
          campaignId,
          productId,
          profitPercentage,
          createdAt: new Date().toISOString()
        }]);
        
      if (error) throw error;
    } catch (error) {
      console.error(`Error linking product ${productId} to campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Gets products linked to a campaign
   */
  static async getCampaignProducts(campaignId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_products')
        .select(`
          productId,
          profitPercentage,
          products:productId (*)
        `)
        .eq('campaignId', campaignId);
        
      if (error) throw error;
      return data?.map(item => ({
        ...item.products,
        profitPercentage: item.profitPercentage
      })) || [];
    } catch (error) {
      console.error(`Error fetching products for campaign ${campaignId}:`, error);
      throw error;
    }
  }
}
