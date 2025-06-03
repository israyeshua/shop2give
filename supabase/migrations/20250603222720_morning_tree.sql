-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema for auth
CREATE SCHEMA IF NOT EXISTS auth;

-- Create tables
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    description TEXT,
    goal DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    main_image_url TEXT,
    category VARCHAR,
    campaign_manager_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    badge VARCHAR,
    stock INTEGER DEFAULT 0,
    campaign_id UUID REFERENCES campaigns(id),
    stripe_product_id VARCHAR,
    stripe_price_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    slug VARCHAR NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    user_id UUID,
    amount DECIMAL(12, 2) NOT NULL,
    stripe_session_id VARCHAR,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    total DECIMAL(12, 2) NOT NULL,
    stripe_session_id VARCHAR,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    campaign_id UUID REFERENCES campaigns(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample categories
INSERT INTO categories (name, slug, description, icon)
VALUES 
    ('Medical', 'medical', 'Support healthcare and medical needs', 'heart-pulse'),
    ('Education', 'education', 'Support educational initiatives and schools', 'graduation-cap'),
    ('Mission & Faith', 'mission-faith', 'Support faith-based missions and initiatives', 'pray'),
    ('Community', 'community', 'Support local community projects', 'users'),
    ('Emergency Relief', 'emergency-relief', 'Support disaster relief efforts', 'alert-triangle')
ON CONFLICT (slug) DO NOTHING;

-- Create sample campaign
INSERT INTO campaigns (
    slug, 
    title, 
    description, 
    goal, 
    current_amount, 
    main_image_url, 
    category, 
    campaign_manager_id
)
VALUES (
    'royal-mission-school-sifra-bachtiar',
    'Royal Mission School - Sifra Bachtiar',
    'Support Sifra Bachtiar''s education at Royal Mission School, where faith and academic excellence unite to shape future leaders.',
    7000.00,
    2540.00,
    'https://images.unsplash.com/photo-1577896851231-70ef18881754',
    'Mission & Faith',
    uuid_generate_v4()
)
ON CONFLICT (slug) DO NOTHING;

-- Create sample products
INSERT INTO products (
    title, 
    description, 
    price, 
    image_url, 
    badge,
    stock,
    campaign_id
)
VALUES 
    (
        'Faith Over Fear Print',
        'Beautiful wall print with "Faith Over Fear" calligraphy on premium paper.',
        24.99,
        'https://images.unsplash.com/photo-1581343109297-b0723170dc42',
        NULL,
        100,
        (SELECT id FROM campaigns WHERE slug = 'royal-mission-school-sifra-bachtiar')
    ),
    (
        'Cross Bracelet',
        'Handcrafted bracelet featuring a delicate cross charm on an adjustable leather band.',
        19.99,
        'https://images.unsplash.com/photo-1620001069118-16a303d12cc2',
        'NEW',
        50,
        (SELECT id FROM campaigns WHERE slug = 'royal-mission-school-sifra-bachtiar')
    ),
    (
        'Christian Wall Art',
        'Set of 3 scripture-inspired prints for your home or office.',
        39.99,
        'https://images.unsplash.com/photo-1606143962339-99f8c0209d26',
        NULL,
        25,
        (SELECT id FROM campaigns WHERE slug = 'royal-mission-school-sifra-bachtiar')
    )
ON CONFLICT DO NOTHING;

-- Create RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create public access policies (read-only)
CREATE POLICY "Allow public read access to campaigns" 
    ON campaigns FOR SELECT USING (true);

CREATE POLICY "Allow public read access to products" 
    ON products FOR SELECT USING (true);
    
CREATE POLICY "Allow public read access to categories" 
    ON categories FOR SELECT USING (true);

-- Create authenticated user policies
CREATE POLICY "Allow authenticated users to create donations"
    ON donations FOR INSERT TO authenticated USING (true);

CREATE POLICY "Allow users to view their own donations"
    ON donations FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to create orders"
    ON orders FOR INSERT TO authenticated USING (true);

CREATE POLICY "Allow users to view their own orders"
    ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to create order items"
    ON order_items FOR INSERT TO authenticated USING (true);

CREATE POLICY "Allow users to view their own order items"
    ON order_items FOR SELECT TO authenticated 
    USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create functions for user management
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();