import React, { useState } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext';

interface LocationSelectorProps {
  onLocationSet?: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationSet }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const { setUserLocation, nearbyStores, selectedStore, selectStore } = useLocation();

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    try {
      // In a real app, you'd use a geocoding service like Google Maps API
      // For demo, we'll use Bangalore coordinates with some variation
      const baseLatitude = 12.9716;
      const baseLongitude = 77.5946;
      const variation = 0.1;
      
      const latitude = baseLatitude + (Math.random() - 0.5) * variation;
      const longitude = baseLongitude + (Math.random() - 0.5) * variation;

      await setUserLocation({
        latitude,
        longitude,
        address: address.trim()
      });

      setShowStores(true);
    } catch (error) {
      console.error('Error setting location:', error);
      alert('Failed to set location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: 'Current Location'
            });
            setShowStores(true);
          } catch (error) {
            console.error('Error setting location:', error);
            alert('Failed to set your location. Please try again.');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Unable to get your current location. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location access was denied. Please allow location access and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
              break;
          }
          alert(errorMessage + ' Please enter your address manually.');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };

  const handleStoreSelect = (store: any) => {
    selectStore(store);
    onLocationSet?.();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {!showStores ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <MapPin className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Where should we deliver?</h2>
            <p className="text-gray-600">Enter your delivery address to find nearby stores</p>
          </div>

          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Finding Stores...' : 'Find Nearby Stores'}
              </button>

              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={loading}
                className="w-full border border-amber-500 text-amber-600 hover:bg-amber-50 py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Use Current Location</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Select Your Store</h2>
            <p className="text-gray-600">Choose a store for delivery and pickup</p>
          </div>

          {nearbyStores.length > 0 ? (
            <div className="space-y-3">
              {nearbyStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleStoreSelect(store)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{store.address}</div>
                      <div className="flex items-center space-x-4 mt-2">
                        {store.delivery_enabled && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Delivery Available
                          </span>
                        )}
                        {store.pickup_enabled && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Pickup Available
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-amber-600">
                        {store.distance ? `${store.distance.toFixed(1)} km` : 'Distance unknown'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {store.mobile}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No stores found in your delivery area.</p>
              <button
                onClick={() => setShowStores(false)}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Try Different Address
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowStores(false)}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2 text-sm"
          >
            ← Change Address
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;