// Export all stores from a single file for easier imports
export { useAuth } from './auth';
export { useCampaigns, type Campaign } from './campaigns';
export { useProducts, type Product } from './products';
export { useDonations, type Donation } from './donations';
export { useCheckout, type CartItem, type CheckoutState } from './checkout';

// Re-export any types that are used across multiple stores
export type { CampaignDonation, CampaignStatistics } from './types';
