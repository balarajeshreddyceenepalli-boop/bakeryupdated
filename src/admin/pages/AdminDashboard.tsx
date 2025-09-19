import React, { useEffect, useState } from 'react';
import { Store, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch stores count
      const { count: storesCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch orders count and revenue
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount');

      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setStats({
        totalStores: storesCount || 0,
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Stores',
      value: stats.totalStores,
      icon: Store,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-green-500',
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your bakery business</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="text-left p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <h3 className="text-sm font-medium text-gray-900">Add New Store</h3>
              <p className="text-sm text-gray-500">Add a new bakery location</p>
            </button>
            <button className="text-left p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <h3 className="text-sm font-medium text-gray-900">Add New Product</h3>
              <p className="text-sm text-gray-500">Create a new product listing</p>
            </button>
            <button className="text-left p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <h3 className="text-sm font-medium text-gray-900">Manage Promotions</h3>
              <p className="text-sm text-gray-500">Set up deals and offers</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;