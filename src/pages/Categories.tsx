import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import CategoryCard from '../components/ui/CategoryCard';
import { ProductCard } from '../components/ui/ProductCard';
import { supabase } from '../lib/supabase';
import { Category, Product, Subcategory } from '../types';
import { useLocation } from '../contexts/LocationContext';

const Categories: React.FC = () => {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [searchParams] = useSearchParams();
  const categoryIdFromQuery = searchParams.get('category');
  const { selectedStore } = useLocation();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use categoryId from URL params or query params
  const activeCategoryId = categoryId || categoryIdFromQuery;

  useEffect(() => {
    fetchData();
  }, [activeCategoryId, selectedStore]);

  const fetchData = async () => {
    try {
      if (activeCategoryId) {
        // Fetch specific category and its products
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', activeCategoryId)
          .single();

        if (categoryError) throw categoryError;
        setSelectedCategory(categoryData);
        
        // Fetch products for this category
        let productsQuery = supabase
          .from('products')
          .select(`
            *,
            subcategories!inner(
              id,
              name,
              categories!inner(
                id,
                name
              )
            ),
            product_flavors(*)
          `)
          .eq('subcategories.categories.id', activeCategoryId)
          .eq('is_active', true);

        // If store is selected, only show products available in that store
        if (selectedStore) {
          productsQuery = productsQuery
            .select(`
              *,
              subcategories!inner(
                id,
                name,
                categories!inner(
                  id,
                  name
                )
              ),
              product_flavors(*),
              product_store_fulfillment!inner(*)
            `)
            .eq('product_store_fulfillment.store_id', selectedStore.id)
            .eq('product_store_fulfillment.is_available', true);
        }

        const { data: productsData, error: productsError } = await productsQuery;

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
        setProducts([]);
        setSubcategories([]);
        setSelectedCategory(null);
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

  if (activeCategoryId && selectedCategory) {
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

          {/* Subcategories */}
          {subcategories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Subcategories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {subcategories.map((subcategory) => (
                  <div key={subcategory.id} className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-shadow">
                    {subcategory.image_url && (
                      <img
                        src={subcategory.image_url}
                        alt={subcategory.name}
                        className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
                      />
                    )}
                    <h3 className="text-sm font-medium text-gray-900">{subcategory.name}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {products.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {selectedStore 
                  ? 'No products available in this category for your selected store.' 
                  : 'No products found in this category.'
                }
              </p>
              {!selectedStore && (
                <p className="text-gray-500 mt-2">Please select a store to see available products.</p>
              )}
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