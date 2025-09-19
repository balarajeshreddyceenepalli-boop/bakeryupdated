/*
  # Remove Subcategories and Add Store Fulfillment

  1. Schema Changes
    - Remove subcategory_id from products table
    - Add category_id directly to products table
    - Create product_store_fulfillment table for store-product relationships
    - Add location fields to user_profiles for address validation
    - Create coupons table for checkout

  2. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add category_id to products table and remove subcategory_id
DO $$
BEGIN
  -- Add category_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update existing products to link directly to categories (via subcategories)
UPDATE products 
SET category_id = subcategories.category_id
FROM subcategories 
WHERE products.subcategory_id = subcategories.id
AND products.category_id IS NULL;

-- Make category_id NOT NULL after data migration
ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;

-- Create product store fulfillment table
CREATE TABLE IF NOT EXISTS product_store_fulfillment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  is_available boolean DEFAULT true,
  stock_quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, store_id)
);

-- Create coupons table for checkout
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount')) DEFAULT 'percentage',
  discount_value decimal(10,2) NOT NULL DEFAULT 0,
  minimum_order_amount decimal(10,2) DEFAULT 0,
  maximum_discount_amount decimal(10,2),
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add location fields to user_profiles for better address handling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'street_address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN street_address text;
    ALTER TABLE user_profiles ADD COLUMN landmark text;
    ALTER TABLE user_profiles ADD COLUMN area text;
  END IF;
END $$;

-- Update promotions table to support more types
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_promotion_type_check;
  
  -- Add the new constraint with more options
  ALTER TABLE promotions ADD CONSTRAINT promotions_promotion_type_check 
    CHECK (promotion_type IN ('top_deal', 'most_selling', 'featured', 'new_arrival', 'seasonal'));
END $$;

-- Enable RLS on new tables
ALTER TABLE product_store_fulfillment ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Public can view product store availability" ON product_store_fulfillment
  FOR SELECT TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Allow all operations on product_store_fulfillment" ON product_store_fulfillment
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public can view active coupons" ON coupons
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Allow all operations on coupons" ON coupons
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Insert sample product store fulfillment data
DO $$
DECLARE
    product_record RECORD;
    store_record RECORD;
BEGIN
    -- For each product, make it available in all stores by default
    FOR product_record IN SELECT id FROM products LOOP
        FOR store_record IN SELECT id FROM stores LOOP
            INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
            VALUES (product_record.id, store_record.id, true, 100)
            ON CONFLICT (product_id, store_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Insert sample coupons
INSERT INTO coupons (code, name, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit) VALUES
('WELCOME10', 'Welcome Offer', 'Get 10% off on your first order', 'percentage', 10, 500, 200, 100),
('SAVE50', 'Flat ₹50 Off', 'Get flat ₹50 off on orders above ₹300', 'fixed_amount', 50, 300, NULL, 200),
('SWEET20', 'Sweet Deal', 'Get 20% off on orders above ₹1000', 'percentage', 20, 1000, 500, 50)
ON CONFLICT (code) DO NOTHING;