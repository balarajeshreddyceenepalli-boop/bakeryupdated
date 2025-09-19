import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, MapPin, User, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLocation as useLocationContext } from '../../contexts/LocationContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { getItemCount } = useCart();
  const { selectedStore, clearLocation } = useLocationContext();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: 'Account', href: '/account' },
    { name: 'Orders', href: '/orders' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SD</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Sweet Delights</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-gray-700 hover:text-amber-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-600 hover:text-amber-600 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Location */}
            <Link
              to="/location"
              className="p-2 text-gray-600 hover:text-amber-600 transition-colors"
              title={selectedStore ? `Current: ${selectedStore.name}` : 'Select Location'}
            >
              <MapPin className="w-5 h-5" />
            </Link>

            {/* Location dropdown for desktop */}
            {selectedStore && (
              <div className="hidden md:block relative group">
                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-amber-600 transition-colors">
                  <MapPin className="w-4 h-4" />
                  <span className="max-w-32 truncate">{selectedStore.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{selectedStore.name}</div>
                    <div className="text-xs text-gray-500 truncate">{selectedStore.address}</div>
                  </div>
                  <button
                    onClick={clearLocation}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Change Location
                  </button>
                </div>
              </div>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-amber-600 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Link>

            {/* User Account */}
            {user ? (
              <div className="relative group">
                <button className="p-2 text-gray-600 hover:text-amber-600 transition-colors">
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    to="/account"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Account
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-amber-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 border-t">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-gray-700 hover:text-amber-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {!user && (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-amber-600 hover:bg-amber-50"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;