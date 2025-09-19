import React from 'react';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SD</span>
              </div>
              <span className="text-xl font-bold">Sweet Delights</span>
            </div>
            <p className="text-gray-400">
              Premium bakery in Bangalore serving fresh cakes, pastries, and baked goods since 2015.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/categories" className="hover:text-white transition-colors">Categories</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Service</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/orders" className="hover:text-white transition-colors">Track Order</a></li>
              <li><a href="/returns" className="hover:text-white transition-colors">Returns</a></li>
              <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/support" className="hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+91-9876543210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>info@sweetdelights.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Bangalore, Karnataka</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Sweet Delights. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;