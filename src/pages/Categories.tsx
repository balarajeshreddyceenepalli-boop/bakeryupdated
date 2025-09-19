import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CategoryCard from '../components/ui/CategoryCard';
import { ProductCard } from '../components/ui/ProductCard';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../types';

const Categories: React.FC = () => {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    try {
      if (categoryId) {
        // Fetch specific category and its products
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (categoryError) throw categoryError;
        setSelectedCategory(categoryData);

        // Fetch products for this category
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            subcategory:subcategories!inner(*,
              category:categories!inner(*)
            ),
            flavors:product_flavors(*)
          `)
          .eq('subcategory.category.id', categoryId)
          .eq('is_active', true);

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } else {
        // Fetch all categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (categoryId && selectedCategory) {
    // Show products for selected category
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedCategory.name}</h1>
            {selectedCategory.description && (
              <p className="text-gray-600 max-w-2xl mx-auto">{selectedCategory.description}</p>
            )}
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show all categories
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Categories</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our wide range of freshly baked goods, crafted with love and the finest ingredients
          </p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No categories available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;