import { DonationTarief, PriceOption, Product } from '../../lib/types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Stripe Products service for managing product-related operations
 */
export class StripeProductsService {
  /**
   * Fetch all products from Stripe
   */
  static async getAllProducts(): Promise<Product[]> {
    try {
      console.log('Fetching all products from Stripe via Supabase Function');
      
      // Use Supabase Functions to call the stripe-get-products endpoint
      const { data, error } = await supabase.functions.invoke('stripe-get-products', {
        body: {}
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to fetch products: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data || !data.products) {
        console.error('Invalid response from products service:', data);
        throw new Error('Invalid response: missing products data');
      }
      
      console.log(`Successfully fetched ${data.products.length} products`);
      return data.products.map(this.mapStripeProductToProduct);
    } catch (error) {
      console.error('Fetch Stripe products error:', error);
      throw error;
    }
  }

  /**
   * Fetch products by campaign ID
   */
  static async getProductsByCampaign(campaignId: string): Promise<Product[]> {
    try {
      const response = await fetch(`/api/stripe/products/campaign/${campaignId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch campaign products from Stripe');
      }

      const data = await response.json();
      return data.products.map(this.mapStripeProductToProduct);
    } catch (error) {
      console.error('Fetch campaign products error:', error);
      throw error;
    }
  }

  /**
   * Check if a product exists in Stripe
   * @param category The product category (like 'donation') or a product ID
   * @param campaignId Optional campaign ID to further filter products
   */
  static async productExists(categoryOrId: string, campaignId?: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/stripe/products/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: categoryOrId, // Using categoryOrId as the productId parameter
          campaignId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check product existence');
      }

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Check product exists error:', error);
      return false;
    }
  }

  /**
   * Create a new product in Stripe
   */
  static async createProduct(
    name: string,
    description: string,
    price: number,
    category: string,
    imageUrl: string,
    campaignId?: string,
    metadata: Record<string, string> = {}
  ): Promise<Product> {
    try {
      // Add campaign ID to metadata if provided
      if (campaignId) {
        metadata.campaign_id = campaignId;
      }

      console.log('Creating product in Stripe via Supabase Function:', {
        name,
        description,
        price,
        category,
        imageUrl,
        metadata
      });

      // Use Supabase Functions to call the stripe-create-product endpoint
      const { data, error } = await supabase.functions.invoke('stripe-create-product', {
        body: {
          name,
          description,
          price,
          category,
          imageUrl,
          metadata,
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to create product: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data || !data.product) {
        console.error('Invalid response from product creation:', data);
        throw new Error('Invalid response: missing product data');
      }
      
      console.log('Successfully created product:', data.product);
      return this.mapStripeProductToProduct(data.product);
    } catch (error) {
      console.error('Create Stripe product error:', error);
      throw error;
    }
  }

  /**
   * Check if a donation product already exists for a campaign
   */
  static async getDonationProductForCampaign(campaignId: string): Promise<Product | null> {
    try {
      // First try to find existing donation products for this campaign
      const response = await fetch(`/api/stripe/products/campaign/${campaignId}?category=donation`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const donationProducts = data.products
        .map(this.mapStripeProductToProduct)
        .filter((p: Product) => p.category === 'donation');

      // Return the first donation product if found
      return donationProducts.length > 0 ? donationProducts[0] : null;
    } catch (error) {
      console.error('Check donation product error:', error);
      return null; // Return null on error to allow creating a new product
    }
  }

  /**
   * Create a donation product with multiple tariffs for a campaign
   * or update an existing one if it already exists
   */
  static async createDonationProductForCampaign(
    campaignName: string,
    campaignId: string,
    tariffs: DonationTarief[]
  ): Promise<Product> {
    try {
      // Check if donation product already exists for this campaign
      const existingProduct = await this.getDonationProductForCampaign(campaignId);
      
      if (existingProduct) {
        console.log(`Found existing donation product for campaign ${campaignId}`);
        
        // Check if any tariffs need to be added to the existing product
        const updatedProduct = await this.updateDonationProductTariffs(existingProduct, tariffs);
        return updatedProduct || existingProduct;
      }
      
      // If no existing product, create a new one
      console.log(`Creating new donation product for campaign ${campaignId}`);
      const response = await fetch('/api/stripe/products/donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Donatie voor ${campaignName}`,
          campaignId,
          tariffs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create donation product');
      }

      const data = await response.json();
      return this.mapStripeProductToProduct(data.product);
    } catch (error) {
      console.error('Create donation product error:', error);
      throw error;
    }
  }

  /**
   * Update an existing donation product with new tariffs that don't already exist
   */
  static async updateDonationProductTariffs(
    product: Product,
    newTariffs: DonationTarief[]
  ): Promise<Product | null> {
    try {
      // Get existing price options (tariffs)
      const existingPriceOptions = product.priceOptions || [];
      const existingAmounts = existingPriceOptions.map((p: PriceOption) => p.amount); // Already in euros
      
      // Find tariffs that don't already exist
      const missingTariffs = newTariffs.filter(tariff => 
        !existingAmounts.includes(tariff.amount)
      );
      
      if (missingTariffs.length === 0) {
        console.log('No new tariffs to add to existing donation product');
        return null; // No updates needed
      }
      
      console.log(`Adding ${missingTariffs.length} new tariffs to existing donation product`);
      
      // Add each missing tariff as a new price point
      for (const tariff of missingTariffs) {
        await this.addPriceToProduct(product.id, tariff.amount * 100); // Convert euros to cents
      }
      
      // Fetch the updated product
      const response = await fetch(`/api/stripe/products/${product.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch updated product');
      }
      
      const data = await response.json();
      return this.mapStripeProductToProduct(data.product);
    } catch (error) {
      console.error('Update donation product tariffs error:', error);
      return null; // Return null on error to fall back to the existing product
    }
  }

  /**
   * Add a new price (tariff) to an existing product
   */
  static async addPriceToProduct(
    productId: string,
    amount: number,
    currency: string = 'eur'
  ): Promise<string> {
    try {
      const response = await fetch(`/api/stripe/products/${productId}/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add price to product');
      }

      const data = await response.json();
      return data.priceId;
    } catch (error) {
      console.error('Add price to product error:', error);
      throw error;
    }
  }

  /**
   * Map a Stripe product object to our Product type
   */
  private static mapStripeProductToProduct(stripeProduct: any): Product {
    // Get the default price if available
    const price = stripeProduct.default_price?.unit_amount 
      ? stripeProduct.default_price.unit_amount / 100 
      : 0;

    // Extract campaign ID from metadata
    const campaignId = stripeProduct.metadata?.campaign_id || null;

    return {
      id: stripeProduct.id,
      name: stripeProduct.name,
      description: stripeProduct.description || '',
      price: price,
      category: stripeProduct.metadata?.category || 'other',
      imageUrl: stripeProduct.images?.[0] || '',
      featured: stripeProduct.metadata?.featured === 'true',
      stockQuantity: parseInt(stripeProduct.metadata?.stock_quantity || '0', 10),
      priceId: stripeProduct.default_price?.id || '',
      campaignId: campaignId,
      // Store all available price options for donation products
      priceOptions: stripeProduct.prices?.map((price: any) => ({
        id: price.id,
        amount: price.unit_amount / 100,
      })) || []
    };
  }

  /**
   * Seed donation products for a campaign
   */
  static async seedDonationProductsForCampaign(
    campaignName: string,
    campaignId: string
  ): Promise<void> {
    // Default donation tariffs
    const tariffs: DonationTarief[] = [
      { amount: 5.00, description: '' },
      { amount: 10.00, description: '' },
      { amount: 20.00, description: '' },
      { amount: 25.00, description: '' },
      { amount: 30.00, description: '' },
      { amount: 50.00, description: '' },
      { amount: 100.00, description: '' }
    ];

    // First try to find an existing donation product for this campaign directly
    const existingProduct = await this.getDonationProductForCampaign(campaignId);
    console.log(`Checking for existing donation product for campaign ${campaignId}:`, existingProduct ? 'Found' : 'Not found');
    
    if (!existingProduct) {
      // No existing product found, create a new one
      console.log(`Creating new donation product for campaign ${campaignId}`);
      await this.createDonationProductForCampaign(campaignName, campaignId, tariffs);
    } else {
      // Product exists, check if all tariffs exist
      console.log(`Using existing donation product for campaign ${campaignId}`);
      
      // Get existing price amounts
      const existingPrices = existingProduct.priceOptions?.map(p => p.amount) || [];
      console.log(`Existing price options:`, existingPrices);
      
      // Add missing tariffs
      const missingTariffs = tariffs.filter(tariff => !existingPrices.includes(tariff.amount));
      
      if (missingTariffs.length > 0) {
        console.log(`Adding ${missingTariffs.length} missing tariffs to existing product`);
        for (const tariff of missingTariffs) {
          await this.addPriceToProduct(existingProduct.id, tariff.amount * 100);
        }
      } else {
        console.log('All tariffs already exist, no changes needed');
      }
    }
  }
}
