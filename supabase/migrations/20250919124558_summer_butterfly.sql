/*
  # Add Sample Products with Weight-Based Pricing

  1. Sample Products
    - Add products for each category with different weight options
    - Include weight-based pricing in weight_options as JSON
    - Add product flavors and store fulfillment

  2. Weight-Based Pricing Structure
    - weight_options will store JSON with weight and price
    - Format: [{"weight": "500g", "price": 250}, {"weight": "1kg", "price": 450}]
*/

-- First, let's get the category and store IDs for reference
DO $$
DECLARE
    cakes_cat_id uuid;
    pastries_cat_id uuid;
    cookies_cat_id uuid;
    breads_cat_id uuid;
    store1_id uuid;
    store2_id uuid;
    subcategory_id uuid;
    product_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO cakes_cat_id FROM categories WHERE name = 'Cakes' LIMIT 1;
    SELECT id INTO pastries_cat_id FROM categories WHERE name = 'Pastries' LIMIT 1;
    SELECT id INTO cookies_cat_id FROM categories WHERE name = 'Cookies' LIMIT 1;
    SELECT id INTO breads_cat_id FROM categories WHERE name = 'Breads' LIMIT 1;
    
    -- Get store IDs
    SELECT id INTO store1_id FROM stores ORDER BY created_at LIMIT 1;
    SELECT id INTO store2_id FROM stores ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- If we don't have enough stores, use the first one for both
    IF store2_id IS NULL THEN
        store2_id := store1_id;
    END IF;

    -- Create subcategories if they don't exist and add products
    
    -- CAKES CATEGORY
    IF cakes_cat_id IS NOT NULL THEN
        -- Birthday Cakes subcategory
        INSERT INTO subcategories (category_id, name, description, display_order, is_active)
        VALUES (cakes_cat_id, 'Birthday Cakes', 'Special cakes for birthdays', 1, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO subcategory_id;
        
        IF subcategory_id IS NULL THEN
            SELECT id INTO subcategory_id FROM subcategories WHERE category_id = cakes_cat_id AND name = 'Birthday Cakes' LIMIT 1;
        END IF;
        
        -- Chocolate Birthday Cake
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Chocolate Birthday Cake',
            'Rich chocolate cake perfect for birthday celebrations',
            0,
            '[{"weight": "500g", "price": 450}, {"weight": "1kg", "price": 850}, {"weight": "2kg", "price": 1600}]'::jsonb,
            '["https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg"]'::jsonb,
            true,
            true
        ) RETURNING id INTO product_id;
        
        -- Add flavors
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, 'Dark Chocolate', 0, true),
            (product_id, 'Milk Chocolate', 0, true),
            (product_id, 'White Chocolate', 50, true);
            
        -- Add store fulfillment
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 20),
            (product_id, store2_id, true, 15);
        
        -- Vanilla Birthday Cake
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Vanilla Birthday Cake',
            'Classic vanilla cake with buttercream frosting',
            0,
            '[{"weight": "500g", "price": 400}, {"weight": "1kg", "price": 750}, {"weight": "2kg", "price": 1400}]'::jsonb,
            '["https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg"]'::jsonb,
            true,
            false
        ) RETURNING id INTO product_id;
        
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, 'Classic Vanilla', 0, true),
            (product_id, 'French Vanilla', 30, true);
            
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 25),
            (product_id, store2_id, true, 20);

        -- Wedding Cakes subcategory
        INSERT INTO subcategories (category_id, name, description, display_order, is_active)
        VALUES (cakes_cat_id, 'Wedding Cakes', 'Elegant cakes for weddings', 2, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO subcategory_id;
        
        IF subcategory_id IS NULL THEN
            SELECT id INTO subcategory_id FROM subcategories WHERE category_id = cakes_cat_id AND name = 'Wedding Cakes' LIMIT 1;
        END IF;
        
        -- Multi-Tier Wedding Cake
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Multi-Tier Wedding Cake',
            'Elegant multi-tier cake perfect for weddings',
            0,
            '[{"weight": "2kg", "price": 2500}, {"weight": "3kg", "price": 3500}, {"weight": "5kg", "price": 5500}]'::jsonb,
            '["https://images.pexels.com/photos/1702373/pexels-photo-1702373.jpeg"]'::jsonb,
            true,
            true
        ) RETURNING id INTO product_id;
        
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, 'Vanilla & Chocolate', 0, true),
            (product_id, 'Red Velvet', 200, true),
            (product_id, 'Lemon', 100, true);
            
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 5),
            (product_id, store2_id, true, 3);
    END IF;

    -- PASTRIES CATEGORY
    IF pastries_cat_id IS NOT NULL THEN
        -- Sweet Pastries subcategory
        INSERT INTO subcategories (category_id, name, description, display_order, is_active)
        VALUES (pastries_cat_id, 'Sweet Pastries', 'Delicious sweet pastries', 1, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO subcategory_id;
        
        IF subcategory_id IS NULL THEN
            SELECT id INTO subcategory_id FROM subcategories WHERE category_id = pastries_cat_id AND name = 'Sweet Pastries' LIMIT 1;
        END IF;
        
        -- Croissants
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Fresh Croissants',
            'Buttery, flaky croissants baked fresh daily',
            0,
            '[{"weight": "1 piece", "price": 45}, {"weight": "6 pieces", "price": 250}, {"weight": "12 pieces", "price": 480}]'::jsonb,
            '["https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg"]'::jsonb,
            true,
            true
        ) RETURNING id INTO product_id;
        
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, 'Plain', 0, true),
            (product_id, 'Chocolate', 10, true),
            (product_id, 'Almond', 15, true);
            
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 50),
            (product_id, store2_id, true, 40);
        
        -- Danish Pastries
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Danish Pastries',
            'Traditional Danish pastries with various fillings',
            0,
            '[{"weight": "1 piece", "price": 65}, {"weight": "4 pieces", "price": 240}, {"weight": "8 pieces", "price": 460}]'::jsonb,
            '["https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg"]'::jsonb,
            true,
            false
        ) RETURNING id INTO product_id;
        
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, 'Apple', 0, true),
            (product_id, 'Cherry', 5, true),
            (product_id, 'Cream Cheese', 10, true);
            
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 30),
            (product_id, store2_id, true, 25);
    END IF;

    -- COOKIES CATEGORY
    IF cookies_cat_id IS NOT NULL THEN
        -- Biscuits subcategory
        INSERT INTO subcategories (category_id, name, description, display_order, is_active)
        VALUES (cookies_cat_id, 'Biscuits', 'Crispy and soft biscuits', 1, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO subcategory_id;
        
        IF subcategory_id IS NULL THEN
            SELECT id INTO subcategory_id FROM subcategories WHERE category_id = cookies_cat_id AND name = 'Biscuits' LIMIT 1;
        END IF;
        
        -- Chocolate Chip Cookies
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Chocolate Chip Cookies',
            'Classic chocolate chip cookies, soft and chewy',
            0,
            '[{"weight": "250g", "price": 180}, {"weight": "500g", "price": 340}, {"weight": "1kg", "price": 650}]'::jsonb,
            '["https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg"]'::jsonb,
            true,
            true
        ) RETURNING id INTO product_id;
        
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, 'Classic', 0, true),
            (product_id, 'Double Chocolate', 20, true),
            (product_id, 'White Chocolate', 15, true);
            
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 40),
            (product_id, store2_id, true, 35);
        
        -- Butter Cookies
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Butter Cookies',
            'Rich and buttery cookies that melt in your mouth',
            0,
            '[{"weight": "200g", "price": 220}, {"weight": "400g", "price": 420}, {"weight": "800g", "price": 800}]'::jsonb,
            '["https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"]'::jsonb,
            true,
            false
        ) RETURNING id INTO product_id;
        
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, 'Plain Butter', 0, true),
            (product_id, 'Vanilla', 10, true),
            (product_id, 'Coconut', 15, true);
            
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 35),
            (product_id, store2_id, true, 30);
    END IF;

    -- BREADS CATEGORY
    IF breads_cat_id IS NOT NULL THEN
        -- Fresh Breads subcategory
        INSERT INTO subcategories (category_id, name, description, display_order, is_active)
        VALUES (breads_cat_id, 'Fresh Breads', 'Freshly baked breads daily', 1, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO subcategory_id;
        
        IF subcategory_id IS NULL THEN
            SELECT id INTO subcategory_id FROM subcategories WHERE category_id = breads_cat_id AND name = 'Fresh Breads' LIMIT 1;
        END IF;
        
        -- White Bread
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Fresh White Bread',
            'Soft and fluffy white bread, perfect for sandwiches',
            0,
            '[{"weight": "400g", "price": 35}, {"weight": "800g", "price": 65}]'::jsonb,
            '["https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg"]'::jsonb,
            true,
            true
        ) RETURNING id INTO product_id;
        
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, 'Regular', 0, true),
            (product_id, 'Enriched', 5, true);
            
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 60),
            (product_id, store2_id, true, 50);
        
        -- Whole Wheat Bread
        INSERT INTO products (subcategory_id, name, description, base_price, weight_options, image_urls, is_active, is_featured)
        VALUES (
            subcategory_id,
            'Whole Wheat Bread',
            'Healthy whole wheat bread with a nutty flavor',
            0,
            '[{"weight": "400g", "price": 45}, {"weight": "800g", "price": 85}]'::jsonb,
            '["https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg"]'::jsonb,
            true,
            false
        ) RETURNING id INTO product_id;
        
        INSERT INTO product_flavors (product_id, flavor_name, price_adjustment, is_available)
        VALUES 
            (product_id, '100% Whole Wheat', 0, true),
            (product_id, 'Multigrain', 10, true);
            
        INSERT INTO product_store_fulfillment (product_id, store_id, is_available, stock_quantity)
        VALUES 
            (product_id, store1_id, true, 45),
            (product_id, store2_id, true, 40);
    END IF;

END $$;