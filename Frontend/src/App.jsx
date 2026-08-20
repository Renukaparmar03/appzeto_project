import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryNav from './components/CategoryNav'
import HeroBanner from './components/HeroBanner'
import CategorySection from './components/CategorySection'
import ProductGrid from './components/ProductGrid'
import ProductDetailPage from './components/ProductDetailPage'
import BottomNav from './components/BottomNav'
import OrdersPage from './components/OrdersPage'
import CategoryPage from './components/CategoryPage'
import ProfilePage from './components/ProfilePage'
import CartPage from './components/CartPage'
import PaymentPage from './components/PaymentPage'
import OrderSuccessPage from './components/OrderSuccessPage'
import FloatingCart from './components/FloatingCart'
import DeliveryApp from './components/delivery/DeliveryApp'
import SellerApp from './components/seller/SellerApp'
import AdminApp from './components/admin/AdminApp'
import UserLogin from './components/UserLogin'
import UserRegister from './components/UserRegister'
import ResetPassword from './components/ResetPassword'
import WishlistPage from './components/WishlistPage'
import './App.css'

function CustomerApp() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('user_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('user_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'DARK') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';

    // If user is not logged in and trying to access main tabs, redirect to login
    if (!isLoggedIn && location.pathname !== '/user/login' && location.pathname !== '/user/register') {
      navigate('/user/login');
      return;
    }

    // Redirect base path to /user/home if logged in
    if (isLoggedIn && (location.pathname === '/' || location.pathname === '/user' || location.pathname === '/user/' || location.pathname === '/user/login' || location.pathname === '/user/register')) {
      navigate('/user/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  let activeTab = 'home';
  if (location.pathname.includes('/user/orders')) activeTab = 'orders';
  if (location.pathname.includes('/user/profile')) activeTab = 'profile';
  if (location.pathname.includes('/user/cart')) activeTab = 'cart';
  if (location.pathname.includes('/user/payment')) activeTab = 'payment';
  if (location.pathname.includes('/user/order-success')) activeTab = 'order-success';
  if (location.pathname.includes('/user/category')) activeTab = 'category';
  if (location.pathname.includes('/user/wishlist')) activeTab = 'wishlist';

  useEffect(() => {
    if (activeTab === 'category' && activeCategory === 'All') {
      setActiveCategory('Grocery & Kitchen'); // Default category when navigating to /category
    } else if (activeTab === 'home' && activeCategory !== 'All') {
      setActiveCategory('All');
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeCategory !== 'All' && location.pathname === '/user/home') {
      navigate('/user/category');
    } else if (activeCategory === 'All' && location.pathname === '/user/category') {
      navigate('/user/home');
    }
  }, [activeCategory, location.pathname, navigate]);

  useEffect(() => {
    if (activeTab === 'cart' || activeTab === 'orders' || activeTab === 'profile' || activeTab === 'payment' || activeTab === 'order-success' || activeTab === 'wishlist') {
      setSelectedProduct(null);
    }
  }, [activeTab]);

  const handleTabChange = (tab) => {
    navigate(`/user/${tab}`);
    setSelectedProduct(null);
  };

  return (
    <div className="app">
      {selectedProduct ? (
        <main className="content-area">
          <ProductDetailPage 
            product={selectedProduct} 
            onBack={() => setSelectedProduct(null)} 
            onSelectProduct={setSelectedProduct} 
            cart={cart}
            setCart={setCart}
            wishlist={wishlist}
            setWishlist={setWishlist}
            navigate={navigate}
          />
        </main>
      ) : activeTab === 'cart' ? (
        <main className="content-area full-tab-view">
          <CartPage cart={cart} setCart={setCart} navigate={navigate} />
        </main>
      ) : activeTab === 'payment' ? (
        <main className="content-area full-tab-view">
          <PaymentPage cart={cart} setCart={setCart} navigate={navigate} />
        </main>
      ) : activeTab === 'order-success' ? (
        <main className="content-area full-tab-view">
          <OrderSuccessPage navigate={navigate} />
        </main>
      ) : activeTab === 'wishlist' ? (
        <main className="content-area full-tab-view">
          <WishlistPage 
            wishlist={wishlist} 
            setWishlist={setWishlist} 
            setCart={setCart} 
            onProductSelect={setSelectedProduct} 
            navigate={navigate} 
            setActiveTab={handleTabChange} 
          />
        </main>
      ) : (
        <>
          {/* Persistent Address Header & Searchbar are rendered on the homepage and orders tab */}
          {(activeTab === 'home' || activeTab === 'orders' || activeTab === 'category') && (
            <>
              <Header setActiveTab={handleTabChange} setActiveCategory={setActiveCategory} />
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </>
          )}

          {(activeTab === 'home' || activeTab === 'category') && (
            <>
              <CategoryNav activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
              
              <main className="content-area">
                <HeroBanner />
                <CategorySection activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
                {activeCategory === 'All' ? (
                  <ProductGrid activeCategory={activeCategory} searchQuery={searchQuery} onProductSelect={setSelectedProduct} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} navigate={navigate} />
                ) : (
                  <CategoryPage 
                    activeCategory={activeCategory} 
                    setActiveCategory={setActiveCategory} 
                    searchQuery={searchQuery}
                    onProductSelect={setSelectedProduct} 
                    cart={cart}
                    setCart={setCart}
                    wishlist={wishlist}
                    setWishlist={setWishlist}
                    navigate={navigate}
                  />
                )}
              </main>
            </>
          )}

          {activeTab === 'orders' && (
            <main className="content-area full-tab-view">
              <OrdersPage onProductSelect={setSelectedProduct} />
            </main>
          )}

          {activeTab === 'profile' && (
            <main className="content-area full-tab-view">
              <ProfilePage setActiveTab={handleTabChange} setActiveCategory={setActiveCategory} />
            </main>
          )}

          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={handleTabChange} 
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />
        </>
      )}
      {/* QuickKart Style Floating Cart - Rendered globally except on cart, profile, payment, success, and wishlist pages */}
      {activeTab !== 'cart' && activeTab !== 'profile' && activeTab !== 'payment' && activeTab !== 'order-success' && activeTab !== 'wishlist' && <FloatingCart cart={cart} navigate={navigate} />}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/delivery/*" element={<DeliveryApp />} />
      <Route path="/seller/*" element={<SellerApp />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/user/login" element={<UserLogin />} />
      <Route path="/user/register" element={<UserRegister />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/user/*" element={<CustomerApp />} />
      <Route path="/" element={<Navigate to="/user/home" replace />} />
    </Routes>
  )
}

export default App

