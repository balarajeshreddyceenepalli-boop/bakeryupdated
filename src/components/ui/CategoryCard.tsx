import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const imageUrl = category.image_url || 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg';

  return (
    <Link to={`/categories/${category.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="relative">
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-2">{category.name}</h3>
              {category.description && (
                <p className="text-sm opacity-90">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;