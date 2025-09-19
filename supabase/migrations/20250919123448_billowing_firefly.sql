/*
  # Fix Product-Category Relationship

  1. Database Changes
    - Remove category_id column from products table
    - Ensure products are linked through subcategories
    - Update foreign key constraints

  2. Security
    - Maintain existing RLS policies
*/

-- Remove the category_id column from products table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products DROP COLUMN category_id;
  END IF;
END $$;

-- Ensure subcategory_id is properly set up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory_id uuid REFERENCES subcategories(id) ON DELETE CASCADE;
  END IF;
END $$;