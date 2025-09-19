import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Category, Subcategory } from '../../types';
import ImageUpload from '../components/ImageUpload';

const SubcategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
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
      let query = supabase
        .from('subcategories')
        .select(`
          *,
          category:categories(*)
        `)
        .order('display_order');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubcategory) {
        const { error } = await supabase
          .from('subcategories')
          .update(formData)
          .eq('id', editingSubcategory.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert([formData]);
        
        if (error) throw error;
      }

      await fetchSubcategories();
      resetForm();
    } catch (error) {
      console.error('Error saving subcategory:', error);
      alert('Failed to save subcategory');
    }
  };

  const handleEdit = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({
      category_id: subcategory.category_id,
      name: subcategory.name,
      description: subcategory.description || '',
      image_url: subcategory.image_url || '',
      display_order: subcategory.display_order,
      is_active: subcategory.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory? This will also delete all products in this subcategory.')) return;

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSubcategories();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('Failed to delete subcategory');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      await fetchSubcategories();
    } catch (error) {
      console.error('Error updating subcategory status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: selectedCategory || '',
      name: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
    setEditingSubcategory(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Subcategories Management</h1>
          <p className="text-gray-600">Manage your product subcategories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subcategory</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    Subcategory Name *
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

                <ImageUpload
                  currentImage={formData.image_url}
                  onImageChange={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
                  label="Subcategory Image"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
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
                    {editingSubcategory ? 'Update Subcategory' : 'Add Subcategory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subcategories List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subcategory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
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
            {subcategories.map((subcategory) => (
              <tr key={subcategory.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {subcategory.image_url && (
                      <img
                        src={subcategory.image_url}
                        alt={subcategory.name}
                        className="w-10 h-10 rounded-lg object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subcategory.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {subcategory.category?.name || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {subcategory.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subcategory.display_order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(subcategory.id, subcategory.is_active)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subcategory.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {subcategory.is_active ? (
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
                      onClick={() => handleEdit(subcategory)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subcategory.id)}
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

      {subcategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {selectedCategory 
              ? 'No subcategories found for the selected category.' 
              : 'No subcategories found. Add your first subcategory to get started.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SubcategoriesManagement;