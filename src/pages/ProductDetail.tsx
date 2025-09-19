import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Product, ProductFlavor } from '../types';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ProductCard } from '../components/ui/ProductCard';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<ProductFlavor | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [selectedWeightPrice, setSelectedWeightPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;

    try {
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          subcategory:subcategories(*, category:categories(*)),
          flavors:product_flavors(*)
        `)
        .eq('id', id)
        .single();

      if (productError) throw productError;

      setProduct(productData);
      if (productData.flavors?.length > 0) {
        setSelectedFlavor(productData.flavors[0]);
      }
      
      // Handle weight options
      if (Array.isArray(productData.weight_options) && productData.weight_options.length > 0) {
        const firstOption = productData.weight_options[0];
        if (typeof firstOption === 'object' && firstOption.weight) {
          setSelectedWeight(firstOption.weight);
          setSelectedWeightPrice(firstOption.price);
        } else if (typeof firstOption === 'string') {
          setSelectedWeight(firstOption);
          setSelectedWeightPrice(0);
        }
      }

      // Fetch similar products
      if (productData.subcategory?.category?.id) {
        const { data: similarData, error: similarError } = await supabase
          .from('products')
          .select(`
            *,
            subcategory:subcategories(*, category:categories(*)),
            flavors:product_flavors(*)
          `)
          .eq('subcategory_id', productData.subcategory_id)
          .neq('id', id)
          .eq('is_active', true)
          .limit(4);

        if (similarError) throw similarError;
        setSimilarProducts(similarData || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!product) return 0;
    
    // Use weight-specific price if available, otherwise use base price
    const basePrice = selectedWeightPrice > 0 ? selectedWeightPrice : product.base_price;
    const flavorAdjustment = selectedFlavor?.price_adjustment || 0;
    return basePrice + flavorAdjustment;
  };

  const handleWeightChange = (weight: string) => {
    setSelectedWeight(weight);
    
    // Find the price for this weight
    if (Array.isArray(product?.weight_options)) {
      const weightOption = product.weight_options.find(option => 
        typeof option === 'object' ? option.weight === weight : option === weight
      );
      
      if (weightOption && typeof weightOption === 'object') {
        setSelectedWeightPrice(weightOption.price);
      } else {
        setSelectedWeightPrice(0);
      }
    }
  };
  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!user) {
      alert('Please sign in to add items to cart');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(
        product.id,
        selectedFlavor?.id,
        quantity,
        selectedWeight || undefined
      );
      alert('Product added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const images = product.image_urls?.length > 0 
    ? (Array.isArray(product.image_urls) ? product.image_urls : [product.image_urls])
    : ['https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-amber-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-gray-600">(4.5) • 127 reviews</span>
                </div>
                <p className="text-gray-600">{product.description}</p>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-gray-900">
                ₹{calculatePrice()}
                {selectedWeight && <span className="text-lg font-normal text-gray-600 ml-2">({selectedWeight})</span>}
              </div>

              {/* Flavors */}
              {product.flavors && product.flavors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose Flavor</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {product.flavors.map((flavor) => (
                      <button
                        key={flavor.id}
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`p-3 rounded-lg border text-left ${
                          selectedFlavor?.id === flavor.id
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{flavor.flavor_name}</div>
                        {flavor.price_adjustment !== 0 && (
                          <div className="text-sm text-gray-600">
                            {flavor.price_adjustment > 0 ? '+' : ''}₹{flavor.price_adjustment}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Weight Options */}
              {Array.isArray(product.weight_options) && product.weight_options.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose Weight</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.weight_options.map((weight) => (
                      <button
                        key={typeof weight === 'object' ? weight.weight : weight}
                        onClick={() => handleWeightChange(typeof weight === 'object' ? weight.weight : weight)}
                        className={`px-4 py-2 rounded-lg border ${
                          selectedWeight === (typeof weight === 'object' ? weight.weight : weight)
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div>{typeof weight === 'object' ? weight.weight : weight}</div>
                          {typeof weight === 'object' && weight.price > 0 && (
                            <div className="text-xs">₹{weight.price}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !user}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>
                  {addingToCart ? 'Adding...' : !user ? 'Sign in to Add to Cart' : `Add to Cart - ₹${(calculatePrice() * quantity)}`}
                </span>
              </button>
              
              {!user && (
                <p className="text-sm text-gray-600 text-center">
                  Please <a href="/auth" className="text-amber-600 hover:text-amber-700">sign in</a> to add items to your cart
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;