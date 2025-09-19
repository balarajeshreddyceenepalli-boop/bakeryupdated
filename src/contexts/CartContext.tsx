import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, flavorId?: string, quantity?: number, weight?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedStore } = useLocation();

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('id, user_id, product_id, flavor_id, quantity, weight, created_at, updated_at')
        .eq('user_id', user.id);

      if (cartError) throw cartError;
      if (!cartItems || cartItems.length === 0) {
        setItems([]);
        return;
      }

      const productIds = [...new Set(cartItems.map(item => item.product_id))];
      const flavorIds = [...new Set(cartItems.map(item => item.flavor_id).filter(Boolean))];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, base_price, weight_options, image_urls, subcategory_id')
        .in('id', productIds);

      if (productsError) throw productsError;

      let flavors = [];
      if (flavorIds.length > 0) {
        const { data: flavorsData, error: flavorsError } = await supabase
          .from('product_flavors')
          .select('id, flavor_name, price_adjustment')
          .in('id', flavorIds);

        if (flavorsError) throw flavorsError;
        flavors = flavorsData || [];
      }

      if (selectedStore) {
        const { data: storeProducts, error: storeError } = await supabase
          .from('product_store_fulfillment')
          .select('product_id')
          .eq('store_id', selectedStore.id)
          .eq('is_available', true);

        if (storeError) throw storeError;
        
        const productIds = storeProducts?.map(sp => sp.product_id) || [];
        if (productIds.length > 0) {
          const filteredCartItems = cartItems.filter(item => 
            productIds.includes(item.product_id)
          );
          
          if (filteredCartItems.length === 0) {
            setItems([]);
            return;
          }
        } else {
          setItems([]);
          return;
        }
      }

      const combinedItems = cartItems.map(cartItem => ({
        ...cartItem,
        product: products?.find(p => p.id === cartItem.product_id),
        flavor: flavors.find(f => f.id === cartItem.flavor_id)
      }));

      setItems(combinedItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, flavorId?: string, quantity = 1, weight?: string) => {
    if (!user) return;

    if (selectedStore) {
      const { data: storeProduct, error: storeError } = await supabase
        .from('product_store_fulfillment')
        .select('product_id, store_id, is_available')
        .eq('product_id', productId)
        .eq('store_id', selectedStore.id)
        .eq('is_available', true)
        .single();

      if (storeError || !storeProduct) {
        throw new Error('Product not available in selected store');
      }
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          flavor_id: flavorId,
          quantity,
          weight,
        })
        .select('id');

      if (error) throw error;
      await fetchCartItems();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await fetchCartItems();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      let itemPrice = item.product?.base_price || 0;
      
      if (item.weight && item.product?.weight_options && Array.isArray(item.product.weight_options)) {
        const weightOption = item.product.weight_options.find(option => 
          typeof option === 'object' && option.weight === item.weight
        );
        if (weightOption && typeof weightOption === 'object' && weightOption.price > 0) {
          itemPrice = weightOption.price;
        }
      }
      
      const flavorAdjustment = item.flavor?.price_adjustment || 0;
      return total + (itemPrice + flavorAdjustment) * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    items,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};