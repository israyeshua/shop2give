// Import all API services
import * as StripePayments from './stripe/payments';
import * as StripeProducts from './stripe/products';
import * as StripeWebhook from './stripe/webhook';

import * as SupabaseCampaigns from './supabase/campaigns';
import * as SupabaseProducts from './supabase/products';
import * as SupabaseUsers from './supabase/users';
import * as SupabaseDonations from './supabase/donations';

// Re-export all API services
export * from './stripe/index';
export * from './supabase/index';

// Export a unified API object with proper ES module imports
export const API = {
  // Stripe services
  stripe: {
    payments: StripePayments,
    products: StripeProducts,
    webhook: StripeWebhook,
  },
  
  // Supabase services
  supabase: {
    campaigns: SupabaseCampaigns,
    products: SupabaseProducts,
    users: SupabaseUsers,
    donations: SupabaseDonations,
  }
};
