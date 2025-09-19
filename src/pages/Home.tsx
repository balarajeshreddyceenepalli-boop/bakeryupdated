import React, { useEffect, useState } from 'react';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import LocationSelector from '../components/location/LocationSelector';
import { ProductCard } from '../components/ui/ProductCard';
import CategoryCard from '../components/ui/CategoryCard';
import Carousel from '../components/ui/Carousel';
import { supabase } from '../lib/supabase';
import { Product, Category, Promotion } from '../types';
import { MapPin, Star, TrendingUp, Clock } from 'lucide-react';

export default function Home() {
  const { selectedStore, userLocation, clearLocation } = useLocationContext();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topDeals, setTopDeals] = useState<Product[]>([]);
  const [mostSelling, setMostSelling] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedStore) {
      fetchHomeData();
    }
  }, [selectedStore]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesData) {
        setCategories(categoriesData);
      }

      if (selectedStore) {
        // Fetch featured products available in selected store
        const { data: featuredData } = await supabase
          .from('products')
          .select(`
            *,
            subcategories!inner(
              name,
              categories!inner(name)
            ),
            product_flavors(*),
            product_store_fulfillment!inner(*)
          `)
          .eq('is_active', true)
          .eq('is_featured', true)
          .eq('product_store_fulfillment.store_id', selectedStore.id)
          .eq('product_store_fulfillment.is_available', true)
          .limit(8);

        if (featuredData) {
          setFeaturedProducts(featuredData);
        }

        // Fetch top deals
        const { data: topDealsData } = await supabase
          .from('products')
          .select(`
            *,
            subcategories!inner(
              name,
              categories!inner(name)
            ),
            product_flavors(*),
            product_store_fulfillment!inner(*),
            promotions!inner(*)
          `)
          .eq('is_active', true)
          .eq('promotions.promotion_type', 'top_deal')
          .eq('promotions.is_active', true)
          .eq('product_store_fulfillment.store_id', selectedStore.id)
          .eq('product_store_fulfillment.is_available', true)
          .limit(6);

        if (topDealsData) {
          setTopDeals(topDealsData);
        }

        // Fetch most selling products
        const { data: mostSellingData } = await supabase
          .from('products')
          .select(`
            *,
            subcategories!inner(
              name,
              categories!inner(name)
            ),
            product_flavors(*),
            product_store_fulfillment!inner(*),
            promotions!inner(*)
          `)
          .eq('is_active', true)
          .eq('promotions.promotion_type', 'most_selling')
          .eq('promotions.is_active', true)
          .eq('product_store_fulfillment.store_id', selectedStore.id)
          .eq('product_store_fulfillment.is_available', true)
          .limit(6);

        if (mostSellingData) {
          setMostSelling(mostSellingData);
        }
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show location selector if no store is selected
  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <MapPin className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Fresh Bakery
              </h1>
              <p className="text-gray-600 text-lg">
                To get started, please select your location to find nearby stores and fresh products.
              </p>
            </div>
            <LocationSelector />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fresh products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Info Banner */}
      <div className="bg-indigo-600 text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                Delivering to: <strong>{selectedStore.name}</strong>
              </span>
            </div>
            <button
              onClick={clearLocation}
              className="text-sm underline hover:no-underline"
            >
              Change Location
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <Carousel
            items={[
              {
                id: '1',
                image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg',
                title: 'Fresh Baked Daily',
                subtitle: 'Premium quality cakes and pastries made with love',
                cta: 'Shop Now'
              },
              {
                id: '2',
                image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
                title: 'Birthday Specials',
                subtitle: 'Custom cakes for your special celebrations',
                cta: 'Order Now'
              },
              {
                id: '3',
                image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
                title: 'Artisan Breads',
                subtitle: 'Freshly baked breads and pastries every morning',
                cta: 'Explore'
              }
            ]}
            autoPlay={true}
            interval={4000}
          />
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white p-8 mb-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">
              Fresh Baked Goods Delivered to Your Door
            </h1>
            <p className="text-xl mb-6 opacity-90">
              Discover our delicious selection of cakes, pastries, breads, and more. 
              Made fresh daily with the finest ingredients.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>Premium Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-green-400" />
                <span>Fresh Daily</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span>Best Prices</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Star className="w-6 h-6 text-yellow-500 mr-2" />
              Featured Products
            </h2>
            <div className="flex overflow-x-auto space-x-4 pb-4">
              {featuredProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-64">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top Deals */}
        {topDeals.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 text-red-500 mr-2" />
              Top Deals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Most Selling */}
        {mostSelling.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 text-green-500 mr-2" />
              Most Popular
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mostSelling.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && featuredProducts.length === 0 && topDeals.length === 0 && mostSelling.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MapPin className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products available
            </h3>
            <p className="text-gray-600">
              We're working on stocking products for your selected store. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}