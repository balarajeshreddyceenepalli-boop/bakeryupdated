import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Truck, Store, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { supabase } from '../lib/supabase';
import { UserProfile, Coupon } from '../types';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { selectedStore, userLocation } = useLocation();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    landmark: '',
    area: '',
    city: 'Bangalore',
    pincode: '',
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is normal for new users
          setUserProfile(null);
          return;
        }
        throw error;
      }

      setUserProfile(data);
      setAddressForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        street_address: data.street_address || '',
        landmark: data.landmark || '',
        area: data.area || '',
        city: data.city || 'Bangalore',
        pincode: data.pincode || '',
      });
    } catch (error) {
      // Only log actual errors, not the expected "no profile found" case
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error) {
        alert('Invalid coupon code');
        return;
      }

      const subtotal = getTotalPrice();
      
      // Check minimum order amount
      if (data.minimum_order_amount > subtotal) {
        alert(`Minimum order amount for this coupon is ₹${data.minimum_order_amount}`);
        return;
      }

      // Check usage limit
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        alert('This coupon has reached its usage limit');
        return;
      }

      // Check date validity
      const now = new Date();
      if (data.start_date && new Date(data.start_date) > now) {
        alert('This coupon is not yet valid');
        return;
      }
      if (data.end_date && new Date(data.end_date) < now) {
        alert('This coupon has expired');
        return;
      }

      setAppliedCoupon(data);
      alert('Coupon applied successfully!');
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Failed to apply coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const calculateDiscount = (): number => {
    if (!appliedCoupon) return 0;

    const subtotal = getTotalPrice();
    let discount = 0;

    if (appliedCoupon.discount_type === 'percentage') {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discount = appliedCoupon.discount_value;
    }

    // Apply maximum discount limit
    if (appliedCoupon.maximum_discount_amount && discount > appliedCoupon.maximum_discount_amount) {
      discount = appliedCoupon.maximum_discount_amount;
    }

    return Math.min(discount, subtotal);
  };

  const getFinalTotal = (): number => {
    return Math.max(0, getTotalPrice() - calculateDiscount());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStore) return;

    setLoading(true);

    try {
      // Save/update user profile
      const profileData = {
        id: user.id,
        ...addressForm,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      // Generate order number
      const orderNumber = `SD${Date.now()}`;

      // Create order
      const orderData = {
        user_id: user.id,
        store_id: selectedStore.id,
        order_number: orderNumber,
        total_amount: getFinalTotal(),
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' 
          ? `${addressForm.street_address}, ${addressForm.landmark}, ${addressForm.area}, ${addressForm.city} - ${addressForm.pincode}`
          : null,
        customer_phone: addressForm.phone,
        status: 'pending',
        payment_status: 'pending',
        notes: notes || null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        flavor_id: item.flavor_id,
        quantity: item.quantity,
        unit_price: (() => {
          let itemPrice = item.product?.base_price || 0;
          if (item.weight && item.product?.weight_options && Array.isArray(item.product.weight_options)) {
            const weightOption = item.product.weight_options.find(option => 
              typeof option === 'object' && option.weight === item.weight
            );
            if (weightOption && typeof weightOption === 'object' && weightOption.price > 0) {
              itemPrice = weightOption.price;
            }
          }
          return itemPrice + (item.flavor?.price_adjustment || 0);
        })(),
        total_price: (() => {
          let itemPrice = item.product?.base_price || 0;
          if (item.weight && item.product?.weight_options && Array.isArray(item.product.weight_options)) {
            const weightOption = item.product.weight_options.find(option => 
              typeof option === 'object' && option.weight === item.weight
            );
            if (weightOption && typeof weightOption === 'object' && weightOption.price > 0) {
              itemPrice = weightOption.price;
            }
          }
          return (itemPrice + (item.flavor?.price_adjustment || 0)) * item.quantity;
        })(),
        weight: item.weight,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update coupon usage if applied
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: appliedCoupon.used_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      // Clear cart
      await clearCart();

      // Redirect to orders page
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to place order: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Store Selected</h2>
          <p className="text-gray-600 mb-8">Please select a store to continue with checkout</p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Select Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Store className="w-5 h-5 mr-2" />
                Selected Store
              </h2>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedStore.name}</h3>
                <p className="text-sm text-gray-600">{selectedStore.address}</p>
                <p className="text-sm text-gray-600">{selectedStore.mobile}</p>
              </div>
            </div>

            {/* Delivery Type */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Delivery Option
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStore.delivery_enabled && (
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="delivery"
                      checked={deliveryType === 'delivery'}
                      onChange={(e) => setDeliveryType(e.target.value as 'delivery')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium">Home Delivery</div>
                      <div className="text-sm text-gray-600">Delivered to your address</div>
                    </div>
                  </label>
                )}
                {selectedStore.pickup_enabled && (
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="pickup"
                      checked={deliveryType === 'pickup'}
                      onChange={(e) => setDeliveryType(e.target.value as 'pickup')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium">Store Pickup</div>
                      <div className="text-sm text-gray-600">Collect from store</div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Address Form */}
            {deliveryType === 'delivery' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Address
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.full_name}
                        onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.street_address}
                      onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="House/Flat No, Street Name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Landmark
                      </label>
                      <input
                        type="text"
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.area}
                        onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        pattern="[0-9]{6}"
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-600">Pay when you receive your order</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    disabled
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium">Online Payment</div>
                    <div className="text-sm text-gray-600">Coming Soon</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Coupon */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Coupon Code
              </h2>
              {!appliedCoupon ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={applyCoupon}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-green-800">{appliedCoupon.code}</div>
                      <div className="text-sm text-green-600">{appliedCoupon.name}</div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                {items.map((item) => {
                  // Calculate price based on weight options or base price
                  let itemPrice = item.product?.base_price || 0;
                  
                  // Check if there's a specific price for the selected weight
                  if (item.weight && item.product?.weight_options && Array.isArray(item.product.weight_options)) {
                    const weightOption = item.product.weight_options.find(option => 
                      typeof option === 'object' && option.weight === item.weight
                    );
                    if (weightOption && typeof weightOption === 'object' && weightOption.price > 0) {
                      itemPrice = weightOption.price;
                    }
                  }
                  
                  const price = itemPrice + (item.flavor?.price_adjustment || 0);
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <div className="font-medium">{item.product?.name}</div>
                        {item.flavor && (
                          <div className="text-gray-600">{item.flavor.flavor_name}</div>
                        )}
                        <div className="text-gray-600">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-medium">₹{price * item.quantity}</div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice()}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{calculateDiscount()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>₹{getFinalTotal()}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : `Place Order - ₹${getFinalTotal()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;