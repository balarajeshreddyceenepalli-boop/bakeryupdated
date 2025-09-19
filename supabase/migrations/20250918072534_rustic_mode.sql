/*
  # Add Admin Authentication and Sample Data

  1. New Tables
    - `admin_users` - Admin authentication table
    
  2. Sample Data
    - Insert sample stores, categories, subcategories, products, and promotions
    - Create admin user account
    
  3. Security
    - Enable RLS on admin_users table
    - Add policies for admin access
*/

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  role text DEFAULT 'admin',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample admin user (password: admin123)
INSERT INTO admin_users (email, password_hash, full_name, role) VALUES
('admin@sweetdelights.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample stores
INSERT INTO stores (name, mobile, email, address, delivery_enabled, pickup_enabled, delivery_radius, latitude, longitude) VALUES
('Sweet Delights - Koramangala', '+91-9876543210', 'koramangala@sweetdelights.com', '123 Koramangala 4th Block, Bangalore', true, true, 5, 12.9352, 77.6245),
('Sweet Delights - Indiranagar', '+91-9876543211', 'indiranagar@sweetdelights.com', '456 Indiranagar 100 Feet Road, Bangalore', true, true, 6, 12.9719, 77.6412),
('Sweet Delights - Whitefield', '+91-9876543212', 'whitefield@sweetdelights.com', '789 Whitefield Main Road, Bangalore', true, false, 8, 12.9698, 77.7500),
('Sweet Delights - Jayanagar', '+91-9876543213', 'jayanagar@sweetdelights.com', '321 Jayanagar 4th Block, Bangalore', true, true, 4, 12.9279, 77.5937),
('Sweet Delights - HSR Layout', '+91-9876543214', 'hsr@sweetdelights.com', '654 HSR Layout Sector 1, Bangalore', true, true, 5, 12.9116, 77.6370)
ON CONFLICT DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description, image_url, display_order) VALUES
('Cakes', 'Fresh baked cakes for all occasions', 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg', 1),
('Pastries', 'Delicious pastries and sweet treats', 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg', 2),
('Breads', 'Fresh baked breads and loaves', 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg', 3),
('Cookies', 'Crispy and soft cookies', 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg', 4),
('Desserts', 'Special desserts and sweets', 'https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg', 5),
('Custom Orders', 'Custom cakes and special orders', 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg', 6)
ON CONFLICT DO NOTHING;

-- Insert sample subcategories
DO $$
DECLARE
    cakes_id uuid;
    pastries_id uuid;
    breads_id uuid;
    cookies_id uuid;
    desserts_id uuid;
BEGIN
    SELECT id INTO cakes_id FROM categories WHERE name = 'Cakes' LIMIT 1;
    SELECT id INTO pastries_id FROM categories WHERE name = 'Pastries' LIMIT 1;
    SELECT id INTO breads_id FROM categories WHERE name = 'Breads' LIMIT 1;
    SELECT id INTO cookies_id FROM categories WHERE name = 'Cookies' LIMIT 1;
    SELECT id INTO desserts_id FROM categories WHERE name = 'Desserts' LIMIT 1;

    INSERT INTO subcategories (category_id, name, description, image_url, display_order) VALUES
    (cakes_id, 'Birthday Cakes', 'Special cakes for birthdays', 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg', 1),
    (cakes_id, 'Wedding Cakes', 'Elegant wedding cakes', 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg', 2),
    (cakes_id, 'Chocolate Cakes', 'Rich chocolate cakes', 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg', 3),
    (pastries_id, 'Croissants', 'Buttery French croissants', 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg', 1),
    (pastries_id, 'Danish Pastries', 'Sweet Danish pastries', 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg', 2),
    (breads_id, 'White Bread', 'Fresh white bread loaves', 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg', 1),
    (breads_id, 'Whole Wheat Bread', 'Healthy whole wheat bread', 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg', 2),
    (cookies_id, 'Chocolate Chip', 'Classic chocolate chip cookies', 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg', 1),
    (cookies_id, 'Oatmeal Cookies', 'Healthy oatmeal cookies', 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg', 2),
    (desserts_id, 'Tiramisu', 'Italian tiramisu dessert', 'https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg', 1)
    ON CONFLICT DO NOTHING;
END $$;

-- Insert sample products
DO $$
DECLARE
    birthday_cakes_id uuid;
    chocolate_cakes_id uuid;
    croissants_id uuid;
    chocolate_chip_id uuid;
BEGIN
    SELECT id INTO birthday_cakes_id FROM subcategories WHERE name = 'Birthday Cakes' LIMIT 1;
    SELECT id INTO chocolate_cakes_id FROM subcategories WHERE name = 'Chocolate Cakes' LIMIT 1;
    SELECT id INTO croissants_id FROM subcategories WHERE name = 'Croissants' LIMIT 1;
    SELECT id INTO chocolate_chip_id FROM subcategories WHERE name = 'Chocolate Chip' LIMIT 1;

    INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_featured) VALUES
    (birthday_cakes_id, 'Classic Vanilla Birthday Cake', 'Delicious vanilla sponge cake with buttercream frosting', 899, '["500g", "1kg", "1.5kg", "2kg"]', '["https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg"]', true),
    (birthday_cakes_id, 'Strawberry Delight Cake', 'Fresh strawberry cake with cream layers', 1299, '["500g", "1kg", "1.5kg", "2kg"]', '["https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg"]', true),
    (chocolate_cakes_id, 'Rich Chocolate Fudge Cake', 'Decadent chocolate cake with fudge frosting', 1199, '["500g", "1kg", "1.5kg", "2kg"]', '["https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg"]', true),
    (chocolate_cakes_id, 'Black Forest Cake', 'Traditional black forest with cherries', 1399, '["500g", "1kg", "1.5kg", "2kg"]', '["https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg"]', false),
    (croissants_id, 'Butter Croissant', 'Flaky buttery French croissant', 89, '["Single", "Pack of 4", "Pack of 6"]', '["https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg"]', false),
    (croissants_id, 'Almond Croissant', 'Croissant filled with almond cream', 129, '["Single", "Pack of 4", "Pack of 6"]', '["https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg"]', false),
    (chocolate_chip_id, 'Classic Chocolate Chip Cookies', 'Crispy cookies with chocolate chips', 299, '["250g", "500g", "1kg"]', '["https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg"]', false),
    (chocolate_chip_id, 'Double Chocolate Cookies', 'Rich chocolate cookies with chocolate chips', 349, '["250g", "500g", "1kg"]', '["https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg"]', false)
    ON CONFLICT DO NOTHING;
END $$;

-- Insert sample product flavors
DO $$
DECLARE
    vanilla_cake_id uuid;
    strawberry_cake_id uuid;
    chocolate_cake_id uuid;
    black_forest_id uuid;
BEGIN
    SELECT id INTO vanilla_cake_id FROM products WHERE name = 'Classic Vanilla Birthday Cake' LIMIT 1;
    SELECT id INTO strawberry_cake_id FROM products WHERE name = 'Strawberry Delight Cake' LIMIT 1;
    SELECT id INTO chocolate_cake_id FROM products WHERE name = 'Rich Chocolate Fudge Cake' LIMIT 1;
    SELECT id INTO black_forest_id FROM products WHERE name = 'Black Forest Cake' LIMIT 1;

    INSERT INTO product_flavors (product_id, flavor_name, price_adjustment) VALUES
    (vanilla_cake_id, 'Vanilla', 0),
    (vanilla_cake_id, 'Chocolate', 50),
    (vanilla_cake_id, 'Strawberry', 100),
    (strawberry_cake_id, 'Fresh Strawberry', 0),
    (strawberry_cake_id, 'Strawberry Chocolate', 150),
    (chocolate_cake_id, 'Dark Chocolate', 0),
    (chocolate_cake_id, 'Milk Chocolate', 50),
    (chocolate_cake_id, 'White Chocolate', 100),
    (black_forest_id, 'Traditional', 0),
    (black_forest_id, 'Extra Cherry', 200)
    ON CONFLICT DO NOTHING;
END $$;

-- Insert sample promotions
DO $$
DECLARE
    vanilla_cake_id uuid;
    strawberry_cake_id uuid;
    chocolate_cake_id uuid;
BEGIN
    SELECT id INTO vanilla_cake_id FROM products WHERE name = 'Classic Vanilla Birthday Cake' LIMIT 1;
    SELECT id INTO strawberry_cake_id FROM products WHERE name = 'Strawberry Delight Cake' LIMIT 1;
    SELECT id INTO chocolate_cake_id FROM products WHERE name = 'Rich Chocolate Fudge Cake' LIMIT 1;

    INSERT INTO promotions (product_id, promotion_type, discount_percentage, display_order) VALUES
    (vanilla_cake_id, 'top_deal', 15, 1),
    (strawberry_cake_id, 'top_deal', 20, 2),
    (chocolate_cake_id, 'most_selling', 10, 1),
    (vanilla_cake_id, 'most_selling', 0, 2)
    ON CONFLICT DO NOTHING;
END $$;