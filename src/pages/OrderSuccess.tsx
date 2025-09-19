import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Clock, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(*),
          items:order_items(*,
            product:products(*),
            flavor:product_flavors(*)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Link
            to="/"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">Thank you for your order. We'll start preparing it right away.</p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">₹{order.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-medium">Cash on Delivery</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Store Information</h2>
              <div className="space-y-2 text-sm">
                <div className="font-medium">{order.store?.name}</div>
                <div className="text-gray-600">{order.store?.address}</div>
                <div className="text-gray-600">{order.store?.mobile}</div>
                <div className="text-gray-600">{order.store?.email}</div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              {order.delivery_type === 'delivery' ? (
                <MapPin className="w-5 h-5 mr-2" />
              ) : (
                <Package className="w-5 h-5 mr-2" />
              )}
              {order.delivery_type === 'delivery' ? 'Delivery Address' : 'Pickup Information'}
            </h2>
            {order.delivery_type === 'delivery' ? (
              <p className="text-gray-600">{order.delivery_address}</p>
            ) : (
              <p className="text-gray-600">
                Please collect your order from the store address mentioned above.
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                <div>
                  <div className="font-medium">{item.product?.name}</div>
                  {item.flavor && (
                    <div className="text-sm text-gray-600">Flavor: {item.flavor.flavor_name}</div>
                  )}
                  {item.weight && (
                    <div className="text-sm text-gray-600">Weight: {item.weight}</div>
                  )}
                  <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₹{item.total_price}</div>
                  <div className="text-sm text-gray-600">₹{item.unit_price} each</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Order Status
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <div className="font-medium text-green-800">Order Confirmed</div>
                  <div className="text-sm text-gray-600">Your order has been received</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Estimated preparation time:</strong> 30-45 minutes
            </p>
            <p className="text-sm text-amber-800 mt-1">
              We'll call you when your order is ready for {order.delivery_type === 'delivery' ? 'delivery' : 'pickup'}.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/orders"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Track Your Orders
          </Link>
          <Link
            to="/"
            className="border border-amber-500 text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;