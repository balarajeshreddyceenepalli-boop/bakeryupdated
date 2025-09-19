import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in from localStorage
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin));
      } catch (error) {
        localStorage.removeItem('adminUser');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // For demo purposes, we'll use a simple check
      // In production, you'd want proper password hashing and verification
      if (email === 'balarajeshreddyceenepalli@gmail.com' && password === 'Rajesh@1307') {
        const adminData: AdminUser = {
          id: '1',
          email: 'balarajeshreddyceenepalli@gmail.com',
          full_name: 'Admin User',
          role: 'admin',
          is_active: true,
        };
        
        setAdminUser(adminData);
        localStorage.setItem('adminUser', JSON.stringify(adminData));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const signOut = async () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

  const value = {
    adminUser,
    loading,
    signIn,
    signOut,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};