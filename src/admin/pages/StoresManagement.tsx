import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Store } from '../../types';

const StoresManagement: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    delivery_enabled: true,
    pickup_enabled: true,
    delivery_radius: 5,
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const storeData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (editingStore) {
        const { error } = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', editingStore.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([storeData]);
        
        if (error) throw error;
      }

      await fetchStores();
      resetForm();
    } catch (error) {
      console.error('Error saving store:', error);
      alert('Failed to save store');
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      mobile: store.mobile,
      email: store.email,
      address: store.address,
      delivery_enabled: store.delivery_enabled,
      pickup_enabled: store.pickup_enabled,
      delivery_radius: store.delivery_radius,
      latitude: store.latitude?.toString() || '',
      longitude: store.longitude?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      alert('Failed to delete store');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      address: '',
      delivery_enabled: true,
      pickup_enabled: true,
      delivery_radius: 5,
      latitude: '',
      longitude: '',
    });
    setEditingStore(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Stores Management</h1>
          <p className="text-gray-600">Manage your bakery store locations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Store</span>
        </button>
      </div>

      {/* Store Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingStore ? 'Edit Store' : 'Add New Store'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Name *
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
                      Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.delivery_radius}
                    onChange={(e) => setFormData({ ...formData, delivery_radius: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.delivery_enabled}
                      onChange={(e) => setFormData({ ...formData, delivery_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Delivery</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.pickup_enabled}
                      onChange={(e) => setFormData({ ...formData, pickup_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Pickup</span>
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
                    {editingStore ? 'Update Store' : 'Add Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stores List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(store)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(store.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>{store.mobile}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{store.email}</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{store.address}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <div className="flex space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    store.delivery_enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {store.delivery_enabled ? 'Delivery' : 'No Delivery'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    store.pickup_enabled 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {store.pickup_enabled ? 'Pickup' : 'No Pickup'}
                  </span>
                </div>
                {store.delivery_enabled && (
                  <span className="text-gray-500">
                    {store.delivery_radius}km radius
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No stores found. Add your first store to get started.</p>
        </div>
      )}
    </div>
  );
};

export default StoresManagement;