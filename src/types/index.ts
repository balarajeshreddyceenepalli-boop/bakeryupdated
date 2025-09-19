export interface Store {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_radius: number;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ProductFlavor {
  id: string;
  product_id: string;
  flavor_name: string;
  price_adjustment: number;
  is_available: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  subcategory_id: string;
  name: string;
  description?: string;
  base_price: number;
  weight_options: Array<{weight: string; price: number}> | string[];
  image_urls: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  subcategory?: Subcategory;
  flavors?: ProductFlavor[];
  stores?: ProductStoreFulfillment[];
}

export interface ProductStoreFulfillment {
  id: string;
  product_id: string;
  store_id: string;
  is_available: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  store?: Store;
}

export interface Promotion {
  id: string;
  product_id: string;
  promotion_type: 'top_deal' | 'most_selling' | 'featured' | 'new_arrival' | 'seasonal';
  discount_percentage: number;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  product?: Product;
  coupon_id?: string;
  coupon?: Coupon;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  street_address?: string;
  landmark?: string;
  area?: string;
  city: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  flavor_id?: string;
  quantity: number;
  weight?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  flavor?: ProductFlavor;
}

export interface Order {
  id: string;
  user_id: string;
  store_id: string;
  order_number: string;
  total_amount: number;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  customer_phone?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  notes?: string;
  created_at: string;
  updated_at: string;
  store?: Store;
  items?: OrderItem[]; // Optional - only loaded when viewing order details
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  flavor_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  weight?: string;
  created_at: string;
  product?: Product;
  flavor?: ProductFlavor;
}