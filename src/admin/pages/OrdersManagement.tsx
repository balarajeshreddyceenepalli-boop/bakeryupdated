import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, Store, Eye, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoadingOrderDetails(true);
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
      return data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'ready':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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

  const handleViewOrder = async (order: Order) => {
    try {
      setShowOrderDetails(true);
      setSelectedOrder(order); // Show basic info first
      
      // Fetch complete order details
      const orderWithDetails = await fetchOrderDetails(order.id);
      setSelectedOrder(orderWithDetails);
    } catch (error) {
      console.error('Error loading order details:', error);
      alert('Failed to load order details');
      setShowOrderDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600">Manage and track customer orders</p>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingOrderDetails && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Order Details - #{selectedOrder.order_number}
                </h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Order Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">₹{selectedOrder.total_amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment:</span>
                        <span className="capitalize">{selectedOrder.payment_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="capitalize">{selectedOrder.delivery_type}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Store Information</h3>
                    <div className="text-sm">
                      <div className="font-medium">{selectedOrder.store?.name}</div>
                      <div className="text-gray-600">{selectedOrder.store?.address}</div>
                      <div className="text-gray-600">{selectedOrder.store?.mobile}</div>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                    <div className="text-sm">
                      <div className="text-gray-600">Phone: {selectedOrder.customer_phone}</div>
                      {selectedOrder.delivery_type === 'delivery' && (
                        <div className="text-gray-600 mt-2">
                          <div className="font-medium">Delivery Address:</div>
                          <div>{selectedOrder.delivery_address}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Status Update</h3>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                {loadingOrderDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading order items...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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
                    {!selectedOrder.items?.length && (
                      <p className="text-gray-600 text-center py-4">No items found</p>
                    )}
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Order Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Store
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{order.order_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.customer_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.store?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">₹{order.total_amount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    {order.delivery_type === 'delivery' ? (
                      <Truck className="w-4 h-4 mr-1" />
                    ) : (
                      <Store className="w-4 h-4 mr-1" />
                    )}
                    {order.delivery_type}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-600">Orders will appear here once customers start placing them.</p>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;