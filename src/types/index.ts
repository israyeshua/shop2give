import { DivideIcon as LucideIcon } from 'lucide-react';

export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  goal?: number;
  raised?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  priceId: string;
  campaignId?: string;
  donationPercentage?: number;
  stripeProductId?: string;
  stripePriceId?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
}

export interface CheckoutMetadata {
  productId: string;
  campaignId?: string;
  donationPercentage: number;
}

export interface StripeLineItem {
  price: string;
  quantity: number;
  metadata: CheckoutMetadata;
}