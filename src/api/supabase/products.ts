import { supabase } from '../../lib/supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  featured: boolean;
  stockQuantity: number;
  priceId: string;
  campaignId: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Service for Supabase product operations
 */
export class SupabaseProductsService {
  /**
   * Fetches all products
   */
  static async getAllProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Fetches featured products
   */
  static async getFeaturedProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }

  /**
   * Fetches a single product by ID
   */
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new product
   */
  static async createProduct(product: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Updates an existing product
   */
  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a product
   */
  static async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches products by category
   */
  static async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Fetches products linked to a campaign
   */
  static async getProductsByCampaign(campaignId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('campaignId', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching products for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Links a product to a campaign
   */
  static async linkProductToCampaign(productId: string, campaignId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          campaignId,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      // Also add entry to campaign_products junction table with default profit percentage
      const { error: linkError } = await supabase
        .from('campaign_products')
        .insert([{
          campaignId,
          productId,
          profitPercentage: 100, // Default to 100% profit to campaign
          createdAt: new Date().toISOString()
        }]);

      if (linkError) throw linkError;
    } catch (error) {
      console.error(`Error linking product ${productId} to campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Unlinks a product from a campaign
   */
  static async unlinkProductFromCampaign(productId: string): Promise<void> {
    try {
      // First get the current campaignId to remove from junction table
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('campaignId')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;
      
      const campaignId = product?.campaignId;
      
      // Update the product
      const { error } = await supabase
        .from('products')
        .update({
          campaignId: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      // If there was a campaign linked, remove from junction table
      if (campaignId) {
        const { error: deleteError } = await supabase
          .from('campaign_products')
          .delete()
          .eq('campaignId', campaignId)
          .eq('productId', productId);

        if (deleteError) throw deleteError;
      }
    } catch (error) {
      console.error(`Error unlinking product ${productId} from campaign:`, error);
      throw error;
    }
  }

  /**
   * Updates profit percentage for a product linked to a campaign
   */
  static async updateCampaignProductProfitPercentage(
    productId: string, 
    campaignId: string, 
    profitPercentage: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaign_products')
        .update({ profitPercentage })
        .eq('campaignId', campaignId)
        .eq('productId', productId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error updating profit percentage for product ${productId}:`, error);
      throw error;
    }
  }
}
