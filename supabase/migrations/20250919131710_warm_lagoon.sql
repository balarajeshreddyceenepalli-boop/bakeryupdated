/*
  # Fix order items RLS policy

  1. Security
    - Add INSERT policy for order_items table
    - Allow authenticated users to insert items for their own orders
    - Ensure users can only add items to orders they own

  2. Changes
    - Create policy to allow INSERT operations on order_items
    - Policy checks that the user owns the order before allowing item insertion
*/

-- Create INSERT policy for order_items
CREATE POLICY "Users can insert items for own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );