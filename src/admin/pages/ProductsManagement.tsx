import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { adminSupabase } from '../../lib/supabase';
import { Product, Category, ProductFlavor, Store, ProductStoreFulfillment } from '../../types';
import ImageUpload from '../components/ImageUpload';

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    subcategory_id: '',
    name: '',
    description: '',
    base_price: 0,
    weight_options: [{ weight: '', price: 0 }],
    image_urls: [''],
    is_active: true,
    is_featured: false,
  });
  const [flavors, setFlavors] = useState<Omit<ProductFlavor, 'id' | 'product_id' | 'created_at'>[]>([
    { flavor_name: '', price_adjustment: 0, is_available: true }
  ]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchStores();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await adminSupabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await adminSupabase
        .from('subcategories')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await adminSupabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await adminSupabase
        .from('products')
        .select(`
          id,
          name,
          base_price,
          weight_options,
          image_urls,
          is_active,
          is_featured,
          subcategory_id,
          subcategory:subcategories(
            id,
            name,
            category:categories(
              id,
              name
            )
          ),
          flavors:product_flavors(
            id,
            flavor_name,
            price_adjustment,
            is_available
          ),
          stores:product_store_fulfillment(
            store_id,
            is_available,
            store:stores(
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Find or create subcategory for the selected category
      let subcategoryId = formData.subcategory_id;
      
      if (!subcategoryId && formData.category_id) {
        // Create a default subcategory for the category
        const category = categories.find(c => c.id === formData.category_id);
        if (category) {
          const { data: subcategoryData, error: subcategoryError } = await adminSupabase
            .from('subcategories')
            .insert([{
              category_id: formData.category_id,
              name: 'General',
              description: `General ${category.name.toLowerCase()}`,
              display_order: 0,
              is_active: true
            }])
            .select()
            .single();
          
          if (subcategoryError) throw subcategoryError;
          subcategoryId = subcategoryData.id;
        }
      }

      const productData = {
        subcategory_id: subcategoryId,
        name: formData.name,
        description: formData.description,
        base_price: formData.base_price,
        weight_options: formData.weight_options.filter(w => w.weight.trim() && w.price > 0),
        image_urls: formData.image_urls.filter(img => img.trim()),
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };

      let productId: string;

      if (editingProduct) {
        const { error } = await adminSupabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        productId = editingProduct.id;

        // Delete existing flavors
        await adminSupabase
          .from('product_flavors')
          .delete()
          .eq('product_id', productId);

        // Delete existing store fulfillment
        await adminSupabase
          .from('product_store_fulfillment')
          .delete()
          .eq('product_id', productId);
      } else {
        const { data, error } = await adminSupabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        
        if (error) throw error;
        productId = data.id;
      }

      // Insert flavors
      const validFlavors = flavors.filter(f => f.flavor_name.trim());
      if (validFlavors.length > 0) {
        const flavorData = validFlavors.map(flavor => ({
          product_id: productId,
          ...flavor
        }));

        const { error: flavorError } = await adminSupabase
          .from('product_flavors')
          .insert(flavorData);

        if (flavorError) throw flavorError;
      }

      // Insert store fulfillment
      if (selectedStores.length > 0) {
        const storeData = selectedStores.map(storeId => ({
          product_id: productId,
          store_id: storeId,
          is_available: true,
          stock_quantity: 100
        }));

        const { error: storeError } = await adminSupabase
          .from('product_store_fulfillment')
          .insert(storeData);

        if (storeError) throw storeError;
      }

      await fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    
    // Parse weight options
    let weightOptions = [{ weight: '', price: 0 }];
    if (product.weight_options && Array.isArray(product.weight_options)) {
      if (typeof product.weight_options[0] === 'string') {
        // Old format - just weight strings
        weightOptions = product.weight_options.map(w => ({ weight: w, price: 0 }));
      } else {
        // New format - objects with weight and price
        weightOptions = product.weight_options;
      }
    }
    
    setFormData({
      category_id: product.subcategory?.category?.id || '',
      subcategory_id: product.subcategory_id,
      name: product.name,
      description: product.description || '',
      base_price: product.base_price,
      weight_options: weightOptions,
      image_urls: Array.isArray(product.image_urls) ? product.image_urls : [],
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    
    if (product.flavors && product.flavors.length > 0) {
      setFlavors(product.flavors.map(f => ({
        flavor_name: f.flavor_name,
        price_adjustment: f.price_adjustment,
        is_available: f.is_available
      })));
    } else {
      setFlavors([{ flavor_name: '', price_adjustment: 0, is_available: true }]);
    }

    // Set selected stores
    if (product.stores && product.stores.length > 0) {
      setSelectedStores(product.stores.map(s => s.store_id));
    } else {
      setSelectedStores([]);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await adminSupabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await adminSupabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      const { error } = await adminSupabase
        .from('products')
        .update({ is_featured: !isFeatured })
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product featured status:', error);
    }
  };

  const addWeightOption = () => {
    setFormData({
      ...formData,
      weight_options: [...formData.weight_options, { weight: '', price: 0 }]
    });
  };

  const removeWeightOption = (index: number) => {
    setFormData({
      ...formData,
      weight_options: formData.weight_options.filter((_, i) => i !== index)
    });
  };

  const addImageUrl = () => {
    setFormData({
      ...formData,
      image_urls: [...formData.image_urls, '']
    });
  };

  const removeImageUrl = (index: number) => {
    setFormData({
      ...formData,
      image_urls: formData.image_urls.filter((_, i) => i !== index)
    });
  };

  const addFlavor = () => {
    setFlavors([...flavors, { flavor_name: '', price_adjustment: 0, is_available: true }]);
  };

  const removeFlavor = (index: number) => {
    setFlavors(flavors.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      subcategory_id: '',
      name: '',
      description: '',
      base_price: 0,
      weight_options: [{ weight: '', price: 0 }],
      image_urls: [''],
      is_active: true,
      is_featured: false,
    });
    setFlavors([{ flavor_name: '', price_adjustment: 0, is_available: true }]);
    setSelectedStores([]);
    setEditingProduct(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage your bakery products</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Weight Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight Options with Pricing
                  </label>
                  {formData.weight_options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g., 500g, 1kg"
                        value={option.weight}
                        onChange={(e) => {
                          const newWeights = [...formData.weight_options];
                          newWeights[index].weight = e.target.value;
                          setFormData({ ...formData, weight_options: newWeights });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={option.price}
                        onChange={(e) => {
                          const newWeights = [...formData.weight_options];
                          newWeights[index].price = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, weight_options: newWeights });
                        }}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      {formData.weight_options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWeightOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addWeightOption}
                    className="text-amber-600 hover:text-amber-800 text-sm"
                  >
                    + Add Weight Option
                  </button>
                </div>

                {/* Image URLs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  {formData.image_urls.map((url, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="url"
                          placeholder="Image URL or upload below"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...formData.image_urls];
                            newUrls[index] = e.target.value;
                            setFormData({ ...formData, image_urls: newUrls });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {formData.image_urls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <ImageUpload
                        currentImage={url}
                        onImageChange={(imageUrl) => {
                          const newUrls = [...formData.image_urls];
                          newUrls[index] = imageUrl;
                          setFormData({ ...formData, image_urls: newUrls });
                        }}
                        label={`Image ${index + 1}`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="text-amber-600 hover:text-amber-800 text-sm"
                  >
                    + Add Another Image
                  </button>
                </div>

                {/* Flavors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Flavors
                  </label>
                  {flavors.map((flavor, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-3 border border-gray-200 rounded-md">
                      <input
                        type="text"
                        placeholder="Flavor name"
                        value={flavor.flavor_name}
                        onChange={(e) => {
                          const newFlavors = [...flavors];
                          newFlavors[index].flavor_name = e.target.value;
                          setFlavors(newFlavors);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price adjustment"
                        value={flavor.price_adjustment}
                        onChange={(e) => {
                          const newFlavors = [...flavors];
                          newFlavors[index].price_adjustment = parseFloat(e.target.value) || 0;
                          setFlavors(newFlavors);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={flavor.is_available}
                          onChange={(e) => {
                            const newFlavors = [...flavors];
                            newFlavors[index].is_available = e.target.checked;
                            setFlavors(newFlavors);
                          }}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="ml-2 text-sm">Available</span>
                      </label>
                      {flavors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFlavor(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFlavor}
                    className="text-amber-600 hover:text-amber-800 text-sm"
                  >
                    + Add Flavor
                  </button>
                </div>

                {/* Store Fulfillment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available in Stores *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {stores.map((store) => (
                      <label key={store.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedStores.includes(store.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStores([...selectedStores, store.id]);
                            } else {
                              setSelectedStores(selectedStores.filter(id => id !== store.id));
                            }
                          }}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{store.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStores(stores.map(s => s.id))}
                      className="text-amber-600 hover:text-amber-800 text-sm"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStores([])}
                      className="text-amber-600 hover:text-amber-800 text-sm"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subcategory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.image_urls?.[0] && (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {product.name}
                        {product.is_featured && (
                          <Star className="w-4 h-4 text-yellow-500 ml-2" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.flavors?.length || 0} flavors
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.subcategory?.category?.name}
                  </div>
                  {product.stores && (
                    <div className="text-sm text-gray-500">
                      {product.stores.length} store{product.stores.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {Array.isArray(product.weight_options) && product.weight_options.length > 0 ? (
                    <div>
                      {typeof product.weight_options[0] === 'object' ? (
                        <div>
                          <div>₹{product.weight_options[0].price}</div>
                          <div className="text-xs text-gray-500">({product.weight_options[0].weight})</div>
                        </div>
                      ) : (
                        `₹${product.base_price}`
                      )}
                    </div>
                  ) : (
                    `₹${product.base_price}`
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => toggleActive(product.id, product.is_active)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.is_active ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => toggleFeatured(product.id, product.is_featured)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_featured
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {product.is_featured ? 'Featured' : 'Regular'}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No products found. Add your first product to get started.</p>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;