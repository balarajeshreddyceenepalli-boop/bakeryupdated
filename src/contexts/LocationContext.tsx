import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store } from '../types';
import { supabase } from '../lib/supabase';

interface LocationContextType {
  userLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  selectedStore: Store | null;
  nearbyStores: Store[];
  loading: boolean;
  setUserLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
  selectStore: (store: Store) => void;
  findNearbyStores: (lat: number, lng: number) => Promise<Store[]>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocationState] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved location and store from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    const savedStore = localStorage.getItem('selectedStore');
    
    if (savedLocation) {
      try {
        setUserLocationState(JSON.parse(savedLocation));
      } catch (error) {
        console.error('Error parsing saved location:', error);
        localStorage.removeItem('userLocation');
      }
    }
    
    if (savedStore) {
      try {
        setSelectedStore(JSON.parse(savedStore));
      } catch (error) {
        console.error('Error parsing saved store:', error);
        localStorage.removeItem('selectedStore');
      }
    }
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const findNearbyStores = async (lat: number, lng: number): Promise<Store[]> => {
    try {
      console.log('Finding stores near:', lat, lng);
      
      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      console.log('All stores:', stores?.length || 0);

      // Calculate distances and filter by delivery radius
      const storesWithDistance = stores
        ?.map(store => {
          if (!store.latitude || !store.longitude) {
            console.log('Store missing coordinates:', store.name);
            return null;
          }
          
          const distance = calculateDistance(lat, lng, store.latitude, store.longitude);
          console.log(`Distance to ${store.name}: ${distance.toFixed(2)}km (radius: ${store.delivery_radius}km)`);
          
          return {
            ...store,
            distance
          };
        })
        .filter(store => store && store.distance <= store.delivery_radius)
        .sort((a, b) => a!.distance - b!.distance) || [];

      console.log('Nearby stores found:', storesWithDistance.length);
      return storesWithDistance.filter(Boolean) as Store[];
    } catch (error) {
      console.error('Error finding nearby stores:', error);
      return [];
    }
  };

  const setUserLocation = async (location: { latitude: number; longitude: number; address?: string }) => {
    setLoading(true);
    try {
      setUserLocationState(location);
      localStorage.setItem('userLocation', JSON.stringify(location));
      
      // Find nearby stores
      const stores = await findNearbyStores(location.latitude, location.longitude);
      setNearbyStores(stores);
      
      console.log('Found stores:', stores.length);
      
    } catch (error) {
      console.error('Error in setUserLocation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectStore = (store: Store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', JSON.stringify(store));
  };

  const clearLocation = () => {
    setUserLocationState(null);
    setSelectedStore(null);
    setNearbyStores([]);
    localStorage.removeItem('userLocation');
    localStorage.removeItem('selectedStore');
  };

  // Try to get user's current location on mount
  useEffect(() => {
    // Only try to get location if not already saved
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Don't set loading to false here, let user manually set location
        }
      );
    }
  }, [userLocation]);

  const value = {
    userLocation,
    selectedStore,
    nearbyStores,
    loading,
    setUserLocation,
    selectStore,
    findNearbyStores,
    clearLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};