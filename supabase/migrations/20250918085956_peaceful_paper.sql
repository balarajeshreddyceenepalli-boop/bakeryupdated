-- Fix RLS policies that reference non-existent users table
-- The database only has user_profiles table, not users table

-- Drop all existing problematic policies that reference users table
DROP POLICY IF EXISTS "Allow admin full access to stores" ON stores;
DROP POLICY IF EXISTS "Allow admin full access to categories" ON categories;
DROP POLICY IF EXISTS "Allow admin full access to subcategories" ON subcategories;
DROP POLICY IF EXISTS "Allow admin full access to products" ON products;
DROP POLICY IF EXISTS "Allow admin full access to product_flavors" ON product_flavors;
DROP POLICY IF EXISTS "Allow admin full access to promotions" ON promotions;

-- Create simple admin policies using auth.email() directly
-- These policies check the authenticated user's email from JWT token

-- Stores policies
CREATE POLICY "Admin full access to stores" ON stores
  FOR ALL TO authenticated
  USING (auth.email() = 'balarajeshreddyceenepalli@gmail.com')
  WITH CHECK (auth.email() = 'balarajeshreddyceenepalli@gmail.com');

-- Categories policies  
CREATE POLICY "Admin full access to categories" ON categories
  FOR ALL TO authenticated
  USING (auth.email() = 'balarajeshreddyceenepalli@gmail.com')
  WITH CHECK (auth.email() = 'balarajeshreddyceenepalli@gmail.com');

-- Subcategories policies
CREATE POLICY "Admin full access to subcategories" ON subcategories
  FOR ALL TO authenticated
  USING (auth.email() = 'balarajeshreddyceenepalli@gmail.com')
  WITH CHECK (auth.email() = 'balarajeshreddyceenepalli@gmail.com');

-- Products policies
CREATE POLICY "Admin full access to products" ON products
  FOR ALL TO authenticated
  USING (auth.email() = 'balarajeshreddyceenepalli@gmail.com')
  WITH CHECK (auth.email() = 'balarajeshreddyceenepalli@gmail.com');

-- Product flavors policies
CREATE POLICY "Admin full access to product_flavors" ON product_flavors
  FOR ALL TO authenticated
  USING (auth.email() = 'balarajeshreddyceenepalli@gmail.com')
  WITH CHECK (auth.email() = 'balarajeshreddyceenepalli@gmail.com');

-- Promotions policies
CREATE POLICY "Admin full access to promotions" ON promotions
  FOR ALL TO authenticated
  USING (auth.email() = 'balarajeshreddyceenepalli@gmail.com')
  WITH CHECK (auth.email() = 'balarajeshreddyceenepalli@gmail.com');