import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getImageUrl = () => {
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    return 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400';
  };

  const getCategoryName = () => {
    return product.subcategory?.category?.name || 'Uncategorized';
  };

  const getPrice = () => {
    // If weight options with pricing exist, show the first price
    if (Array.isArray(product.weight_options) && product.weight_options.length > 0) {
      const firstOption = product.weight_options[0];
      if (typeof firstOption === 'object' && firstOption.price > 0) {
        return firstOption.price;
      }
    }
    return product.base_price;
  };

  const getWeightLabel = () => {
    if (Array.isArray(product.weight_options) && product.weight_options.length > 0) {
      const firstOption = product.weight_options[0];
      if (typeof firstOption === 'object' && firstOption.weight) {
        return ` (${firstOption.weight})`;
      } else if (typeof firstOption === 'string') {
        return ` (${firstOption})`;
      }
    }
    return '';
  };

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="aspect-square overflow-hidden">
          <img
            src={getImageUrl()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <div className="text-xs text-gray-500 mb-1">
            {getCategoryName()}
          </div>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-green-600">
                ₹{getPrice()}
              </span>
              <span className="text-xs text-gray-500">
                {getWeightLabel()}
              </span>
            </div>
            {product.is_featured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Featured
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};