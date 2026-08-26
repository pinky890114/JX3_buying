import React from 'react';
import { ShoppingCart, ShoppingBag, ShieldCheck, Cat, ArrowLeft } from 'lucide-react';
import { ProxyRateConfig } from '../types';
import { AdminUser } from '../services/store';

interface NavbarProps {
  currentTab: 'home' | 'shop' | 'query' | 'guide' | 'custom' | 'admin';
  setCurrentTab: (tab: 'home' | 'shop' | 'query' | 'guide' | 'custom' | 'admin') => void;
  cartCount: number;
  onOpenCart: () => void;
  rateConfig: ProxyRateConfig;
  adminUser: AdminUser | null;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  cartCount,
  onOpenCart,
  rateConfig,
  adminUser,
  onOpenAdminLogin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFF0F5]/90 backdrop-blur-md border-b border-[#F5CDDA] text-[#3E2430] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div 
            id="brand-logo-button"
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B8B] flex items-center justify-center text-white shadow-xs group-hover:bg-[#FA5276] transition-all group-hover:scale-105">
              <Cat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-[#3E2430] group-hover:text-[#FA5276] transition-colors">
                  包裡的錢終究是吹向了西山居
                </h1>
                <span className="text-xs bg-[#FFE4ED] text-[#FA5276] font-bold px-2 py-0.5 rounded-full border border-[#F5CDDA] hidden sm:inline-block">
                  🐾 萌貓代購
                </span>
              </div>
              <p className="text-[11px] text-[#8A5A72] hidden sm:block font-medium">
                西山居周邊專屬代購・可愛小貓即時為您送達🐾
              </p>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5">
            {/* If not in home tab, show quick back to home button */}
            {currentTab !== 'home' && (
              <button
                onClick={() => setCurrentTab('home')}
                className="px-3.5 py-2 rounded-full bg-[#FFE4ED] hover:bg-[#FCD8E3] text-[#7D5569] hover:text-[#3E2430] border border-[#F5CDDA] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>回首頁</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className="relative px-3.5 py-2 rounded-full bg-white border border-[#F5CDDA] hover:border-[#FF6B8B] text-[#3E2430] transition-all flex items-center gap-2 shadow-xs hover:shadow-sm cursor-pointer"
              title="購物車清單"
            >
              <ShoppingCart className="w-4 h-4 text-[#FA5276]" />
              <span className="text-xs font-bold text-[#3E2430]">代購單</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FA5276] text-white font-bold text-[11px] flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin status button if logged in */}
            {adminUser && (
              <button
                id="header-admin-portal-btn"
                onClick={() => setCurrentTab('admin')}
                className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-[#FA5276] text-white shadow-xs'
                    : 'bg-[#FFE4ED] text-[#FA5276] border border-[#F5CDDA] hover:bg-[#FCD8E3]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>後台管理</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

