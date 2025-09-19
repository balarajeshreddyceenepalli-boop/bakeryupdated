import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, Store, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Order } from '../types';

const UserOrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
    }
  }, [user, orderId]);

  const fetchOrderDetails = async () => {
    if (!user || !orderId) return;

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
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'ready':
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-8">You need to sign in to view order details</p>
          <Link
            to="/auth"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

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
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-8">The order you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            to="/orders"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
          <div className="flex items-center space-x-4 mb-4">
            {getStatusIcon(order.status)}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <span className="text-2xl font-bold text-gray-900">₹{order.total_amount}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product?.name}</h3>
                      {item.flavor && (
                        <p className="text-sm text-gray-600">Flavor: {item.flavor.flavor_name}</p>
                      )}
                      {item.weight && (
                        <p className="text-sm text-gray-600">Weight: {item.weight}</p>
                      )}
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{item.total_price}</p>
                      <p className="text-sm text-gray-600">₹{item.unit_price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Store Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Store className="w-5 h-5 mr-2" />
                Store Details
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{order.store?.name}</p>
                <p className="text-sm text-gray-600">{order.store?.mobile}</p>
                <p className="text-sm text-gray-600">{order.store?.address}</p>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                {order.delivery_type === 'delivery' ? (
                  <Truck className="w-5 h-5 mr-2" />
                ) : (
                  <Store className="w-5 h-5 mr-2" />
                )}
                {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'} Details
              </h2>
              <div className="space-y-2">
                {order.delivery_type === 'delivery' ? (
                  <>
                    <p className="text-sm text-gray-600">Delivery Address:</p>
                    <p className="font-medium text-gray-900">{order.delivery_address}</p>
                  </>
                ) : (
                  <p className="text-gray-600">Collect from store</p>
                )}
                {order.customer_phone && (
                  <>
                    <p className="text-sm text-gray-600">Contact Number:</p>
                    <p className="font-medium text-gray-900">{order.customer_phone}</p>
                  </>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-medium ${
                    order.payment_status === 'paid' ? 'text-green-600' : 
                    order.payment_status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Notes</h2>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetails;