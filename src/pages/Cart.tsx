import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const Cart: React.FC = () => {
  const { items, loading, updateQuantity, removeFromCart, getTotalPrice, getItemCount } = useCart();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
          </p>
          <Link
            to="/categories"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart ({getItemCount()} items)</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
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
              const totalPrice = price * item.quantity;

              return (
                <div key={item.id} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                  <img
                    src={item.product?.image_urls?.[0] || 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg'}
                    alt={item.product?.name || 'Product'}
                    className="w-16 h-16 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product?.name}</h3>
                    {item.flavor && (
                      <p className="text-sm text-gray-600">Flavor: {item.flavor.flavor_name}</p>
                    )}
                    {item.weight && (
                      <p className="text-sm text-gray-600">Weight: {item.weight}</p>
                    )}
                    <p className="text-lg font-bold text-amber-600">₹{price}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{totalPrice}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-amber-600">₹{getTotalPrice()}</span>
            </div>

            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
              <Link
                to="/categories"
                className="flex-1 block text-center border border-amber-500 text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                to="/checkout"
                className="flex-1 block text-center bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;