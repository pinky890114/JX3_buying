import React, { useState, useEffect } from 'react';
import { proxyStore, AdminUser } from './services/store';
import { Category, ProductItem, CartItem, Order, ProxyRateConfig, SpecOption } from './types';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { ShopCatalog } from './components/ShopCatalog';
import { OrderQuery } from './components/OrderQuery';
import { ProxyGuide } from './components/ProxyGuide';
import { CustomOrderRequest } from './components/CustomOrderRequest';
import { CartDrawer } from './components/CartDrawer';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { Lock, Cat, Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'shop' | 'query' | 'guide' | 'custom' | 'admin'>('home');
  const [categories, setCategories] = useState<Category[]>(proxyStore.getCategories());
  const [products, setProducts] = useState<ProductItem[]>(proxyStore.getProducts());
  const [rateConfig, setRateConfig] = useState<ProxyRateConfig>(proxyStore.getRateConfig());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(proxyStore.getAdminUser());

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Admin login modal state
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Search query to pass to query tab if redirected
  const [queryKeyword, setQueryKeyword] = useState<string>('');

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = proxyStore.subscribe(() => {
      setCategories(proxyStore.getCategories());
      setProducts(proxyStore.getProducts());
      setRateConfig(proxyStore.getRateConfig());
      setAdminUser(proxyStore.getAdminUser());
    });
    return () => unsubscribe();
  }, []);

  // Cart actions
  const handleAddToCart = (item: Omit<CartItem, 'cartItemId'>) => {
    const specKey = Object.entries(item.selectedSpecs)
      .map(([k, v]) => `${k}:${(v as SpecOption)?.id}`)
      .join('|');
    const existingIndex = cartItems.findIndex(
      (c) => c.productId === item.productId && Object.entries(c.selectedSpecs).map(([k, v]) => `${k}:${(v as SpecOption)?.id}`).join('|') === specKey
    );

    if (existingIndex >= 0) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += item.quantity;
      setCartItems(newItems);
    } else {
      const newItem: CartItem = {
        ...item,
        cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setCartItems((prev) => [...prev, newItem]);
    }
  };

  const handleInstantOrder = (item: Omit<CartItem, 'cartItemId'>) => {
    handleAddToCart(item);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(cartItemId);
    } else {
      setCartItems((prev) => prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: qty } : item)));
    }
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // When order is submitted, redirect to query page and search that order
  const handleOrderCreatedRedirect = (orderId: string) => {
    setQueryKeyword(orderId);
    setCurrentTab('query');
  };

  // Floating lock click (Toggles: if already in admin, return to home; otherwise go to admin or open login)
  const handleMiniLockClick = () => {
    if (currentTab === 'admin') {
      setCurrentTab('home');
    } else if (adminUser) {
      setCurrentTab('admin');
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#1E2530] flex flex-col selection:bg-[#C5922E] selection:text-white">
      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {currentTab === 'home' && (
          <HomeHero
            onNavigate={(tab) => setCurrentTab(tab)}
            rateConfig={rateConfig}
            totalOrdersCount={proxyStore.getOrders().length}
          />
        )}

        {currentTab === 'shop' && (
          <ShopCatalog
            categories={categories}
            products={products}
            onAddToCart={handleAddToCart}
            onInstantOrder={handleInstantOrder}
            onBackHome={() => setCurrentTab('home')}
            onOpenCart={() => setIsCartOpen(true)}
            cartCount={totalCartCount}
          />
        )}

        {currentTab === 'query' && (
          <OrderQuery
            initialQuery={queryKeyword}
            onOpenShop={() => setCurrentTab('shop')}
            onBackHome={() => setCurrentTab('home')}
            onOpenCart={() => setIsCartOpen(true)}
            cartCount={totalCartCount}
          />
        )}

        {currentTab === 'guide' && (
          <ProxyGuide
            rateConfig={rateConfig}
            onGoToShop={() => setCurrentTab('shop')}
          />
        )}

        {currentTab === 'custom' && (
          <CustomOrderRequest
            onOrderCreated={handleOrderCreatedRedirect}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            adminUser={adminUser}
            onLogout={() => {
              proxyStore.setAdminUser(null);
              setCurrentTab('home');
            }}
            rateConfig={rateConfig}
            onUpdateRateConfig={(newRates) => proxyStore.updateRateConfig(newRates)}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderCreated={handleOrderCreatedRedirect}
      />

      {/* Admin Login Modal (Google Auth + Developer One-Click Bypass) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setCurrentTab('admin');
        }}
      />

      {/* Bottom Lock Admin Trigger */}
      <footer className="py-8 flex justify-center items-center">
        <button
          id="admin-lock-footer-btn"
          onClick={handleMiniLockClick}
          className="group p-3 rounded-full bg-white/90 hover:bg-[#223147] text-[#8A95A5] hover:text-[#E2B755] border border-[#DDD5C7] hover:border-[#C5922E] shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center"
          title={adminUser ? '點此開啟後台管理系統' : '管理員入口'}
        >
          <Lock className="w-4 h-4 transition-transform group-hover:scale-110" />
        </button>
      </footer>
    </div>
  );
}

