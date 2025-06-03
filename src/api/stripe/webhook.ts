/**
 * Stripe webhook handler to process events from Stripe
 */

import { SupabaseDonationsService } from '../supabase/donations';

interface StripeWebhookPayload {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
  };
}

export class StripeWebhookService {
  /**
   * Process webhook events from Stripe
   */
  static async processWebhookEvent(payload: StripeWebhookPayload): Promise<{ success: boolean; message: string }> {
    try {
      const { type, data } = payload;

      switch (type) {
        case 'checkout.session.completed':
          return await this.handleCheckoutSessionCompleted(data.object);
        
        case 'payment_intent.succeeded':
          return await this.handlePaymentIntentSucceeded(data.object);
        
        case 'payment_intent.payment_failed':
          return await this.handlePaymentIntentFailed(data.object);
        
        default:
          console.log(`Unhandled webhook event type: ${type}`);
          return { success: true, message: `Ignored event type: ${type}` };
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Handle checkout.session.completed event
   */
  private static async handleCheckoutSessionCompleted(session: any): Promise<{ success: boolean; message: string }> {
    try {
      // Extract metadata from the session
      const { metadata } = session;
      
      if (!metadata) {
        return { success: false, message: 'No metadata found in checkout session' };
      }

      const { campaignId, donationId } = metadata;

      // If this is related to a donation, update its status
      if (campaignId && donationId) {
        await SupabaseDonationsService.updateDonationStatus(donationId, 'completed');
        return { success: true, message: `Donation ${donationId} marked as completed` };
      }

      return { success: true, message: 'Checkout session completed successfully' };
    } catch (error) {
      console.error('Error handling checkout session completed:', error);
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Handle payment_intent.succeeded event
   */
  private static async handlePaymentIntentSucceeded(paymentIntent: any): Promise<{ success: boolean; message: string }> {
    try {
      // Extract metadata from the payment intent
      const { metadata } = paymentIntent;
      
      if (!metadata) {
        return { success: false, message: 'No metadata found in payment intent' };
      }

      const { campaignId, donationId } = metadata;

      // If this is related to a donation, update its status
      if (campaignId && donationId) {
        await SupabaseDonationsService.updateDonationStatus(donationId, 'completed');
        return { success: true, message: `Donation ${donationId} marked as completed` };
      }

      return { success: true, message: 'Payment intent succeeded' };
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  private static async handlePaymentIntentFailed(paymentIntent: any): Promise<{ success: boolean; message: string }> {
    try {
      // Extract metadata from the payment intent
      const { metadata } = paymentIntent;
      
      if (!metadata) {
        return { success: false, message: 'No metadata found in payment intent' };
      }

      const { campaignId, donationId } = metadata;

      // If this is related to a donation, update its status
      if (campaignId && donationId) {
        await SupabaseDonationsService.updateDonationStatus(donationId, 'failed');
        return { success: true, message: `Donation ${donationId} marked as failed` };
      }

      return { success: true, message: 'Payment intent failure recorded' };
    } catch (error) {
      console.error('Error handling payment intent failed:', error);
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}
