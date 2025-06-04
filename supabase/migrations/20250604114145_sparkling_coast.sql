-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('creator', 'cause', 'customer', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded');

-- Create users table extension
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role user_role NOT NULL DEFAULT 'customer',
    profile_data JSONB,
    stripe_account_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create creators table
CREATE TABLE public.creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    business_name TEXT NOT NULL,
    description TEXT,
    profile_image_url TEXT,
    stripe_connect_id TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create causes table
CREATE TABLE public.causes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    organization_name TEXT NOT NULL,
    mission_statement TEXT,
    tax_id TEXT,
    verification_status verification_status DEFAULT 'pending',
    stripe_connect_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES creators(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    images TEXT[],
    creator_amount DECIMAL(12,2) NOT NULL,
    max_cause_amount DECIMAL(12,2) NOT NULL,
    inventory_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    stripe_product_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id) NOT NULL,
    stripe_payment_intent_id TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    status order_status DEFAULT 'pending',
    order_items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment splits table
CREATE TABLE public.payment_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) NOT NULL,
    creator_amount DECIMAL(12,2) NOT NULL,
    cause_amount DECIMAL(12,2) NOT NULL,
    creator_tip DECIMAL(12,2) DEFAULT 0,
    cause_extra DECIMAL(12,2) DEFAULT 0,
    stripe_transfer_ids JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- User Profiles
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Creators
CREATE POLICY "Anyone can view verified creators"
    ON public.creators
    FOR SELECT
    USING (is_verified = true);

CREATE POLICY "Creators can manage their own profile"
    ON public.creators
    FOR ALL
    USING (auth.uid() = user_id);

-- Causes
CREATE POLICY "Anyone can view verified causes"
    ON public.causes
    FOR SELECT
    USING (verification_status = 'verified');

CREATE POLICY "Causes can manage their own profile"
    ON public.causes
    FOR ALL
    USING (auth.uid() = user_id);

-- Products
CREATE POLICY "Anyone can view active products"
    ON public.products
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Creators can manage their own products"
    ON public.products
    FOR ALL
    USING (creator_id IN (
        SELECT id FROM creators WHERE user_id = auth.uid()
    ));

-- Orders
CREATE POLICY "Users can view their own orders"
    ON public.orders
    FOR SELECT
    USING (customer_id = auth.uid());

-- Payment Splits
CREATE POLICY "Users can view their related payment splits"
    ON public.payment_splits
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders WHERE customer_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_products_creator_id ON public.products(creator_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_payment_splits_order_id ON public.payment_splits(order_id);