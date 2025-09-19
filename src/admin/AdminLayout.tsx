import React, { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { 
  Store, 
  Package, 
  Tags, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Menu,
  X,
  LogOut,
  Gift
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { adminUser, signOut } = useAdminAuth();

  // Redirect to login if not authenticated
  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: TrendingUp },
    { name: 'Stores', href: '/admin/stores', icon: Store },
    { name: 'Categories', href: '/admin/categories', icon: Tags },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Promotions', href: '/admin/promotions', icon: Gift },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="mt-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-amber-600 bg-amber-50 border-r-2 border-amber-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SD</span>
                </div>
                <h2 className="ml-2 text-lg font-semibold text-gray-900">Admin Panel</h2>
              </div>
              <nav className="mt-5 flex-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mx-2 mb-1 transition-colors ${
                        isActive(item.href)
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Sweet Delights Admin
            </h1>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                View Site
              </Link>
              <button
                onClick={signOut}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;