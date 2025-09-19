import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, TrendingUp, Star, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Promotion, Product, Coupon } from '../../types';

const PromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons'>('promotions');
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  const [promotionFormData, setPromotionFormData] = useState({
    product_id: '',
    promotion_type: 'top_deal' as Promotion['promotion_type'],
    discount_percentage: 0,
    display_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
  });

  const [couponFormData, setCouponFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as Coupon['discount_type'],
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount_amount: 0,
    usage_limit: 0,
    is_active: true,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch promotions
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select(`
          *,
          product:products(*)
        `)
        .order('display_order');

      if (promotionsError) throw promotionsError;

      // Fetch coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (couponsError) throw couponsError;

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          subcategory:subcategories(*,
            category:categories(*)
          )
        `)
        .eq('is_active', true);

      if (productsError) throw productsError;

      setPromotions(promotionsData || []);
      setCoupons(couponsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...promotionFormData,
        start_date: promotionFormData.start_date || null,
        end_date: promotionFormData.end_date || null,
      };

      if (editingPromotion) {
        const { error } = await supabase
          .from('promotions')
          .update(data)
          .eq('id', editingPromotion.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([data]);
        
        if (error) throw error;
      }

      await fetchData();
      resetPromotionForm();
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Failed to save promotion');
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...couponFormData,
        start_date: couponFormData.start_date || null,
        end_date: couponFormData.end_date || null,
        maximum_discount_amount: couponFormData.maximum_discount_amount || null,
        usage_limit: couponFormData.usage_limit || null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(data)
          .eq('id', editingCoupon.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([data]);
        
        if (error) throw error;
      }

      await fetchData();
      resetCouponForm();
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Failed to save coupon');
    }
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setPromotionFormData({
      product_id: promotion.product_id,
      promotion_type: promotion.promotion_type,
      discount_percentage: promotion.discount_percentage,
      display_order: promotion.display_order,
      is_active: promotion.is_active,
      start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
    });
    setShowPromotionForm(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order_amount: coupon.minimum_order_amount,
      maximum_discount_amount: coupon.maximum_discount_amount || 0,
      usage_limit: coupon.usage_limit || 0,
      is_active: coupon.is_active,
      start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
      end_date: coupon.end_date ? coupon.end_date.split('T')[0] : '',
    });
    setShowCouponForm(true);
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Failed to delete promotion');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const togglePromotionActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating promotion status:', error);
    }
  };

  const toggleCouponActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating coupon status:', error);
    }
  };

  const resetPromotionForm = () => {
    setPromotionFormData({
      product_id: '',
      promotion_type: 'top_deal',
      discount_percentage: 0,
      display_order: 0,
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingPromotion(null);
    setShowPromotionForm(false);
  };

  const resetCouponForm = () => {
    setCouponFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_order_amount: 0,
      maximum_discount_amount: 0,
      usage_limit: 0,
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingCoupon(null);
    setShowCouponForm(false);
  };

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'top_deal': return <TrendingUp className="w-4 h-4" />;
      case 'featured': return <Star className="w-4 h-4" />;
      case 'most_selling': return <TrendingUp className="w-4 h-4" />;
      case 'new_arrival': return <Gift className="w-4 h-4" />;
      case 'seasonal': return <Gift className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Coupons</h1>
          <p className="text-gray-600">Manage your promotional campaigns and discount coupons</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('promotions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'promotions'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Product Promotions
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'coupons'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Discount Coupons
          </button>
        </nav>
      </div>

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowPromotionForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Promotion</span>
            </button>
          </div>

          {/* Promotion Form Modal */}
          {showPromotionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {editingPromotion ? 'Edit Promotion' : 'Add New Promotion'}
                  </h2>
                  
                  <form onSubmit={handlePromotionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product *
                      </label>
                      <select
                        required
                        value={promotionFormData.product_id}
                        onChange={(e) => setPromotionFormData({ ...promotionFormData, product_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.subcategory?.category?.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Promotion Type *
                        </label>
                        <select
                          required
                          value={promotionFormData.promotion_type}
                          onChange={(e) => setPromotionFormData({ ...promotionFormData, promotion_type: e.target.value as Promotion['promotion_type'] })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="top_deal">Top Deal</option>
                          <option value="most_selling">Most Selling</option>
                          <option value="featured">Featured</option>
                          <option value="new_arrival">New Arrival</option>
                          <option value="seasonal">Seasonal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount Percentage
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={promotionFormData.discount_percentage}
                          onChange={(e) => setPromotionFormData({ ...promotionFormData, discount_percentage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={promotionFormData.start_date}
                          onChange={(e) => setPromotionFormData({ ...promotionFormData, start_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={promotionFormData.end_date}
                          onChange={(e) => setPromotionFormData({ ...promotionFormData, end_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={promotionFormData.display_order}
                          onChange={(e) => setPromotionFormData({ ...promotionFormData, display_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="flex items-center pt-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={promotionFormData.is_active}
                            onChange={(e) => setPromotionFormData({ ...promotionFormData, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={resetPromotionForm}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                      >
                        {editingPromotion ? 'Update Promotion' : 'Add Promotion'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Promotions List */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
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
                {promotions.map((promotion) => (
                  <tr key={promotion.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {promotion.product?.image_urls?.[0] && (
                          <img
                            src={promotion.product.image_urls[0]}
                            alt={promotion.product.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {promotion.product?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPromotionIcon(promotion.promotion_type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {promotion.promotion_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {promotion.discount_percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {promotion.start_date && promotion.end_date ? (
                        <div>
                          <div>{new Date(promotion.start_date).toLocaleDateString()}</div>
                          <div className="text-gray-500">to {new Date(promotion.end_date).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        'Ongoing'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePromotionActive(promotion.id, promotion.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          promotion.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {promotion.is_active ? (
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPromotion(promotion)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promotion.id)}
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

          {promotions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No promotions found. Add your first promotion to get started.</p>
            </div>
          )}
        </>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowCouponForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Coupon</span>
            </button>
          </div>

          {/* Coupon Form Modal */}
          {showCouponForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                  </h2>
                  
                  <form onSubmit={handleCouponSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Coupon Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={couponFormData.code}
                          onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="e.g., WELCOME10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Coupon Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={couponFormData.name}
                          onChange={(e) => setCouponFormData({ ...couponFormData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={couponFormData.description}
                        onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount Type *
                        </label>
                        <select
                          required
                          value={couponFormData.discount_type}
                          onChange={(e) => setCouponFormData({ ...couponFormData, discount_type: e.target.value as Coupon['discount_type'] })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed_amount">Fixed Amount</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount Value *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={couponFormData.discount_value}
                          onChange={(e) => setCouponFormData({ ...couponFormData, discount_value: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Order Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={couponFormData.minimum_order_amount}
                          onChange={(e) => setCouponFormData({ ...couponFormData, minimum_order_amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Discount Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={couponFormData.maximum_discount_amount}
                          onChange={(e) => setCouponFormData({ ...couponFormData, maximum_discount_amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Usage Limit
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={couponFormData.usage_limit}
                          onChange={(e) => setCouponFormData({ ...couponFormData, usage_limit: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={couponFormData.start_date}
                          onChange={(e) => setCouponFormData({ ...couponFormData, start_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={couponFormData.end_date}
                          onChange={(e) => setCouponFormData({ ...couponFormData, end_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={couponFormData.is_active}
                          onChange={(e) => setCouponFormData({ ...couponFormData, is_active: e.target.checked })}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={resetCouponForm}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                      >
                        {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Coupons List */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coupon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
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
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {coupon.code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {coupon.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}%` 
                          : `₹${coupon.discount_value}`
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        Min: ₹{coupon.minimum_order_amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {coupon.used_count} / {coupon.usage_limit || '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {coupon.start_date && coupon.end_date ? (
                        <div>
                          <div>{new Date(coupon.start_date).toLocaleDateString()}</div>
                          <div className="text-gray-500">to {new Date(coupon.end_date).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        'Ongoing'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleCouponActive(coupon.id, coupon.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {coupon.is_active ? (
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
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

          {coupons.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No coupons found. Add your first coupon to get started.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PromotionsManagement;