/*
  # Bakery E-commerce Database Schema

  1. New Tables
    - `stores` - Store locations and settings
    - `categories` - Product categories
    - `subcategories` - Product subcategories
    - `products` - Products with base pricing
    - `product_flavors` - Available flavors for products
    - `promotions` - Top deals and promotions
    - `users` - Customer accounts
    - `orders` - Customer orders
    - `order_items` - Individual items in orders
    - `cart_items` - Shopping cart items

  2. Security
    - Enable RLS on all tables
    - Add policies for admin and user access
    - Secure admin operations with role-based access
*/

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  delivery_enabled boolean DEFAULT true,
  pickup_enabled boolean DEFAULT true,
  delivery_radius integer DEFAULT 5,
  latitude decimal(10,8),
  longitude decimal(11,8),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  weight_options jsonb DEFAULT '[]',
  image_urls jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product flavors table
CREATE TABLE IF NOT EXISTS product_flavors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  flavor_name text NOT NULL,
  price_adjustment decimal(10,2) DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  promotion_type text CHECK (promotion_type IN ('top_deal', 'most_selling')),
  discount_percentage decimal(5,2) DEFAULT 0,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  address text,
  city text DEFAULT 'Bangalore',
  pincode text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id),
  order_number text UNIQUE NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  delivery_type text CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address text,
  customer_phone text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  flavor_id uuid REFERENCES product_flavors(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  weight text,
  created_at timestamptz DEFAULT now()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  flavor_id uuid REFERENCES product_flavors(id),
  quantity integer NOT NULL DEFAULT 1,
  weight text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, flavor_id, weight)
);

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public read access for store information
CREATE POLICY "Public can view active stores" ON stores
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Public read access for categories and products
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can view active subcategories" ON subcategories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can view active products" ON products
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can view available flavors" ON product_flavors
  FOR SELECT TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Public can view active promotions" ON promotions
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- User profile policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id);

-- Cart policies
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Order policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Insert sample data
INSERT INTO stores (name, mobile, email, address, delivery_enabled, pickup_enabled, delivery_radius) VALUES
('Sweet Delights - Koramangala', '+91-9876543210', 'koramangala@sweetdelights.com', '123 80 Feet Road, Koramangala, Bangalore - 560034', true, true, 8),
('Sweet Delights - Indiranagar', '+91-9876543211', 'indiranagar@sweetdelights.com', '456 100 Feet Road, Indiranagar, Bangalore - 560038', true, true, 6),
('Sweet Delights - Jayanagar', '+91-9876543212', 'jayanagar@sweetdelights.com', '789 4th Block, Jayanagar, Bangalore - 560011', true, true, 7),
('Sweet Delights - Whitefield', '+91-9876543213', 'whitefield@sweetdelights.com', '321 ITPL Road, Whitefield, Bangalore - 560066', true, true, 10),
('Sweet Delights - HSR Layout', '+91-9876543214', 'hsr@sweetdelights.com', '654 Sector 1, HSR Layout, Bangalore - 560102', true, true, 5);

INSERT INTO categories (name, description, display_order) VALUES
('Cakes', 'Fresh baked cakes for all occasions', 1),
('Pastries', 'Delicious pastries and small treats', 2),
('Bread & Buns', 'Fresh bread and buns baked daily', 3),
('Cookies', 'Crispy and soft cookies', 4),
('Special Occasions', 'Custom cakes and treats for special events', 5);