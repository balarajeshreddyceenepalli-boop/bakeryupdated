import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { LocationProvider } from './contexts/LocationContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Categories from './pages/Categories';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import UserOrderDetails from './pages/UserOrderDetails';
import Account from './pages/Account';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminLogin from './admin/components/AdminLogin';
import StoresManagement from './admin/pages/StoresManagement';
import CategoriesManagement from './admin/pages/CategoriesManagement';
import ProductsManagement from './admin/pages/ProductsManagement';
import PromotionsManagement from './admin/pages/PromotionsManagement';
import OrdersManagement from './admin/pages/OrdersManagement';

function App() {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  {/* Admin Login */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/*" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="stores" element={<StoresManagement />} />
                    <Route path="categories" element={<CategoriesManagement />} />
                    <Route path="products" element={<ProductsManagement />} />
                    <Route path="promotions" element={<PromotionsManagement />} />
                    <Route path="orders" element={<OrdersManagement />} />
                  </Route>
                  
                  {/* User Routes */}
                  <Route path="/*" element={
                    <>
                      <Header />
                      <main>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/product/:id" element={<ProductDetail />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/order-success" element={<OrderSuccess />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/order-details/:orderId" element={<UserOrderDetails />} />
                          <Route path="/account" element={<Account />} />
                        </Routes>
                      </main>
                      <Footer />
                    </>
                  } />
                </Routes>
              </div>
            </Router>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </AdminAuthProvider>
  );
}

export default App;