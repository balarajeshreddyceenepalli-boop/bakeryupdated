import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Order } from '../types';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'ready':
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
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
          <p className="text-gray-600 mb-8">You need to sign in to view your orders</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track and manage your bakery orders</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(order.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.order_number}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-lg font-bold text-gray-900">₹{order.total_amount}</span>
                    </div>
                  </div>

                  {/* Store and Delivery Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Store className="w-4 h-4 mr-2" />
                        Store
                      </h4>
                      <p className="text-sm text-gray-600">{order.store?.name}</p>
                      <p className="text-sm text-gray-600">{order.store?.mobile}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        {order.delivery_type === 'delivery' ? (
                          <Truck className="w-4 h-4 mr-2" />
                        ) : (
                          <Store className="w-4 h-4 mr-2" />
                        )}
                        {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}
                      </h4>
                      {order.delivery_type === 'delivery' ? (
                        <p className="text-sm text-gray-600">{order.delivery_address}</p>
                      ) : (
                        <p className="text-sm text-gray-600">Collect from store</p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}

                  {/* Order Actions */}
                  <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row gap-3">
                    <Link
                      to={`/order-details/${order.id}`}
                      className="flex-1 text-center bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      View Details
                    </Link>
                    {order.status === 'pending' && (
                      <button className="flex-1 text-center border border-red-500 text-red-600 hover:bg-red-50 py-2 px-4 rounded-lg font-medium transition-colors">
                        Cancel Order
                      </button>
                    )}
                    {(order.status === 'delivered' || order.status === 'ready') && (
                      <button className="flex-1 text-center border border-amber-500 text-amber-600 hover:bg-amber-50 py-2 px-4 rounded-lg font-medium transition-colors">
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-8">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link
              to="/categories"
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;