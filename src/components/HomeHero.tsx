import React from 'react';
import { ProxyRateConfig } from '../types';
import { Search, ShoppingCart, Calculator, ShieldCheck, Sparkles, Sword } from 'lucide-react';

interface HomeHeroProps {
  onNavigate: (tab: 'shop' | 'query' | 'guide' | 'custom') => void;
  rateConfig: ProxyRateConfig;
  totalOrdersCount: number;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  onNavigate,
  rateConfig,
  totalOrdersCount,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-10 sm:py-16 px-4 space-y-10 sm:space-y-14 animate-fade-in">
      {/* Top Title */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1E2530] tracking-tight">
          包裡的錢終究是吹向了西山居
        </h1>
      </div>

      {/* 2 Main Rounded Minimalist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
        {/* Card 1: 買東西這裡走 */}
        <button
          id="btn-home-shop"
          onClick={() => onNavigate('shop')}
          className="group text-center p-8 sm:p-12 rounded-[28px] bg-linear-to-br from-[#C5922E] via-[#B88224] to-[#9E6E18] text-white transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1.5 flex flex-col items-center justify-center cursor-pointer border border-[#E8C87A]/40"
        >
          <div className="w-20 h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">
            買東西這裡走
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-2 font-normal">
            劍網三同人、西山居等周邊選購
          </p>
        </button>

        {/* Card 2: 進度查詢 */}
        <button
          id="btn-home-query"
          onClick={() => onNavigate('query')}
          className="group text-center p-8 sm:p-12 rounded-[28px] bg-linear-to-br from-[#A62424] via-[#8B1D1D] to-[#5C1010] text-white transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1.5 flex flex-col items-center justify-center cursor-pointer border border-[#FFD875]/30"
        >
          <div className="w-20 h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Search className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">
            進度查詢
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-2 font-normal">
            輸入暱稱或訂單號查詢訂單進度
          </p>
        </button>
      </div>
    </div>
  );
};


