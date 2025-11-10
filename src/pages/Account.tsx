import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, CreditCard as Edit, Save, X, Plus, Trash2, Home, Building, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { Navigate } from 'react-router-dom';

interface Address {
  id: string;
  user_id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  street_address: string;
  landmark?: string;
  area: string;
  city: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const Account: React.FC = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'settings'>('profile');
  
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    landmark: '',
    area: '',
    city: 'Bangalore',
    pincode: '',
  });

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    type: 'home' as 'home' | 'work' | 'other',
    label: '',
    street_address: '',
    landmark: '',
    area: '',
    city: 'Bangalore',
    pincode: '',
    is_default: false,
  });

  // Settings state
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    marketing_communications: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
      fetchSettings();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setProfileForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          street_address: data.street_address || '',
          landmark: data.landmark || '',
          area: data.area || '',
          city: data.city || 'Bangalore',
          pincode: data.pincode || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      // For demo purposes, we'll create a mock addresses table structure
      // In a real app, you'd have an addresses table in Supabase
      const mockAddresses: Address[] = [
        {
          id: '1',
          user_id: user.id,
          type: 'home',
          label: 'Home',
          street_address: '123 Main Street, Apt 4B',
          landmark: 'Near City Mall',
          area: 'Koramangala',
          city: 'Bangalore',
          pincode: '560034',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: user.id,
          type: 'work',
          label: 'Office',
          street_address: '456 Business Park, Tower A',
          landmark: 'Opposite Metro Station',
          area: 'Electronic City',
          city: 'Bangalore',
          pincode: '560100',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      setAddresses(mockAddresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      // For demo purposes, we'll use local state
      // In a real app, you'd store these in a user_settings table
      const savedSettings = localStorage.getItem(`user_settings_${user.id}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const profileData = {
        id: user.id,
        ...profileForm,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (error) throw error;

      await fetchProfile();
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);

    try {
      const addressData = {
        id: editingAddress?.id || Date.now().toString(),
        user_id: user.id,
        ...addressForm,
        label: addressForm.label || getAddressTypeLabel(addressForm.type),
        created_at: editingAddress?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (editingAddress) {
        // Update existing address
        setAddresses(prev => prev.map(addr => 
          addr.id === editingAddress.id ? addressData as Address : addr
        ));
      } else {
        // Add new address
        setAddresses(prev => [...prev, addressData as Address]);
      }

      // If this is set as default, remove default from others
      if (addressForm.is_default) {
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          is_default: addr.id === addressData.id
        })));
      }

      resetAddressForm();
      alert(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      alert('Address deleted successfully!');
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address. Please try again.');
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      type: address.type,
      label: address.label,
      street_address: address.street_address,
      landmark: address.landmark || '',
      area: address.area,
      city: address.city,
      pincode: address.pincode,
      is_default: address.is_default,
    });
    setShowAddressForm(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      type: 'home',
      label: '',
      street_address: '',
      landmark: '',
      area: '',
      city: 'Bangalore',
      pincode: '',
      is_default: false,
    });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'home': return 'Home';
      case 'work': return 'Work';
      case 'other': return 'Other';
      default: return 'Address';
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Building className="w-4 h-4" />;
      case 'other': return <Heart className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const handleSettingsUpdate = async (key: string, value: boolean) => {
    setSettingsLoading(true);
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Save to localStorage (in a real app, save to database)
      localStorage.setItem(`user_settings_${user.id}`, JSON.stringify(newSettings));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    setSettingsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      const userData = {
        profile,
        addresses,
        settings,
        user: { id: user.id, email: user.email },
        exported_at: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-account-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Your data has been downloaded successfully!');
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Failed to download data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Are you sure you want to delete your account? This action cannot be undone. Type "DELETE" to confirm:'
    );
    
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      // In a real app, you'd call an API to delete the account
      alert('Account deletion requested. You will receive an email with further instructions.');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600">Manage your profile and account settings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'addresses'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Addresses
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              {!editingProfile ? (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="flex items-center space-x-2 text-amber-600 hover:text-amber-700"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      fetchProfile();
                    }}
                    className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  {editingProfile ? (
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{profile?.full_name || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  {editingProfile ? (
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{profile?.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Default Address</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  {editingProfile ? (
                    <input
                      type="text"
                      value={profileForm.street_address}
                      onChange={(e) => setProfileForm({ ...profileForm, street_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="House/Flat No, Street Name"
                    />
                  ) : (
                    <div className="flex items-start space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>{profile?.street_address || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landmark
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.landmark}
                        onChange={(e) => setProfileForm({ ...profileForm, landmark: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Nearby landmark"
                      />
                    ) : (
                      <span className="text-gray-600">{profile?.landmark || 'Not provided'}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.area}
                        onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Area/Locality"
                      />
                    ) : (
                      <span className="text-gray-600">{profile?.area || 'Not provided'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    ) : (
                      <span className="text-gray-600">{profile?.city || 'Bangalore'}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        pattern="[0-9]{6}"
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="6-digit pincode"
                      />
                    ) : (
                      <span className="text-gray-600">{profile?.pincode || 'Not provided'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
              <button
                onClick={() => setShowAddressForm(true)}
                className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Address</span>
              </button>
            </div>

            {/* Address Form Modal */}
            {showAddressForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Type *
                          </label>
                          <select
                            value={addressForm.type}
                            onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value as 'home' | 'work' | 'other' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={addressForm.label}
                            onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="e.g., Home, Office, Mom's House"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={addressForm.street_address}
                          onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="House/Flat No, Street Name"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Landmark
                          </label>
                          <input
                            type="text"
                            value={addressForm.landmark}
                            onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Nearby landmark"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Area *
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.area}
                            onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Area/Locality"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            required
                            pattern="[0-9]{6}"
                            value={addressForm.pincode}
                            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="6-digit pincode"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_default"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                          Set as default address
                        </label>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={resetAddressForm}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={addressLoading}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors disabled:opacity-50"
                        >
                          {addressLoading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses List */}
            {addresses.length > 0 ? (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getAddressIcon(address.type)}
                          <span className="font-medium text-gray-900">{address.label}</span>
                          {address.is_default && (
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{address.street_address}</div>
                          {address.landmark && <div>Near {address.landmark}</div>}
                          <div>{address.area}, {address.city} - {address.pincode}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Addresses</h3>
                <p className="text-gray-600 mb-6">
                  Add your frequently used addresses for faster checkout
                </p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive order updates and promotional emails</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.email_notifications}
                      onChange={(e) => handleSettingsUpdate('email_notifications', e.target.checked)}
                      disabled={settingsLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                    <p className="text-sm text-gray-500">Receive order updates via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.sms_notifications}
                      onChange={(e) => handleSettingsUpdate('sms_notifications', e.target.checked)}
                      disabled={settingsLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Marketing Communications</h3>
                    <p className="text-sm text-gray-500">Receive promotional offers and deals</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.marketing_communications}
                      onChange={(e) => handleSettingsUpdate('marketing_communications', e.target.checked)}
                      disabled={settingsLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy & Security</h2>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </button>

                <button 
                  onClick={handleDownloadData}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-sm font-medium text-gray-900">Download My Data</h3>
                  <p className="text-sm text-gray-500">Get a copy of your account data</p>
                </button>

                <button 
                  onClick={handleDeleteAccount}
                  className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                >
                  <h3 className="text-sm font-medium">Delete Account</h3>
                  <p className="text-sm text-red-500">Permanently delete your account and data</p>
                </button>
              </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={settingsLoading}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors disabled:opacity-50"
                        >
                          {settingsLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Sign Out */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;