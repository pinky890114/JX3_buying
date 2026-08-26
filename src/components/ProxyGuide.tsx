import React, { useState } from 'react';
import { ProxyRateConfig } from '../types';
import { Calculator, ArrowRight, ShieldCheck, Truck, Clock, Sparkles, HelpCircle, CheckCircle2, Cat, Heart } from 'lucide-react';

interface ProxyGuideProps {
  rateConfig: ProxyRateConfig;
  onGoToShop: () => void;
}

export const ProxyGuide: React.FC<ProxyGuideProps> = ({
  rateConfig,
  onGoToShop,
}) => {
  const [inputRmb, setInputRmb] = useState<number>(100);
  const [estWeightKg, setEstWeightKg] = useState<number>(1);
  const [shippingOption, setShippingOption] = useState<'7-11' | 'home'>('7-11');

  // Calculations
  const baseTwd = inputRmb * rateConfig.exchangeRate;
  const serviceFeeTwd = Math.ceil(baseTwd * (rateConfig.serviceFeePercent / 100));
  const goodsTotalTwd = Math.ceil(baseTwd + serviceFeeTwd);
  const intlShippingTwd = Math.ceil(estWeightKg * rateConfig.intlShippingPerKgTwd);
  const domesticShippingTwd = shippingOption === '7-11' ? rateConfig.twDomesticShipping711 : 100;
  const grandTotalTwd = goodsTotalTwd + intlShippingTwd + domesticShippingTwd;
  const estimatedDepositTwd = Math.ceil(goodsTotalTwd * 0.5);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#F5CDDA] shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[#FA5276] text-xs font-bold uppercase tracking-wider mb-1">
            <Cat className="w-4 h-4" />
            <span>【代購須知 & 匯率試算】公開透明機制 🐾</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3E2430]">
            透明匯率試算與代購作業指南
          </h2>
          <p className="text-sm text-[#8A5A72] mt-2">
            沒有隱藏費用！輸入人民幣原價與預估重量，系統即時為您拆解台幣商品款、服務費與國內外運費。
          </p>
        </div>
      </div>

      {/* Interactive Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#F5CDDA] space-y-4 shadow-xs">
          <h3 className="text-base sm:text-lg font-bold text-[#3E2430] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#FA5276]" />
            即時金額試算機
          </h3>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="font-bold text-[#3E2430]">
                商品原價 (人民幣 ¥ RMB)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#FA5276] font-bold">
                  ¥
                </span>
                <input
                  type="number"
                  min="1"
                  value={inputRmb}
                  onChange={(e) => setInputRmb(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] font-mono text-base font-bold outline-none focus:border-[#FA5276]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#3E2430]">
                預估包裹重量 (公斤 kg)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={estWeightKg}
                  onChange={(e) => setEstWeightKg(Math.max(0.1, Number(e.target.value)))}
                  className="w-full p-3 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] font-mono text-sm outline-none focus:border-[#FA5276]"
                />
                <span className="text-xs text-[#8A5A72] shrink-0">立牌約0.2kg / 設定集約1.5kg</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#3E2430]">台灣超商 / 寄送方式</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShippingOption('7-11')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                    shippingOption === '7-11'
                      ? 'bg-[#FF6B8B] border-[#FF6B8B] text-white shadow-xs'
                      : 'bg-[#FFF5F8] border-[#F5CDDA] text-[#7D5569] hover:bg-[#FFE4ED]'
                  }`}
                >
                  7-11 / 全家 ($60)
                </button>
                <button
                  type="button"
                  onClick={() => setShippingOption('home')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                    shippingOption === 'home'
                      ? 'bg-[#FF6B8B] border-[#FF6B8B] text-white shadow-xs'
                      : 'bg-[#FFF5F8] border-[#F5CDDA] text-[#7D5569] hover:bg-[#FFE4ED]'
                  }`}
                >
                  宅配到府 ($100)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Breakdown Card */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#F5CDDA] space-y-4 shadow-xs">
          <h3 className="text-base sm:text-lg font-bold text-[#3E2430] flex items-center justify-between">
            <span>費用計算明細清單</span>
            <span className="text-xs font-normal text-[#8A5A72]">
              匯率: {rateConfig.exchangeRate} ｜ 服務費: {rateConfig.serviceFeePercent}%
            </span>
          </h3>

          <div className="space-y-2 text-xs sm:text-sm text-[#7D5569] divide-y divide-[#F5CDDA]">
            <div className="flex justify-between py-1.5">
              <span>商品折合台幣 (¥{inputRmb} x {rateConfig.exchangeRate})：</span>
              <span className="font-mono font-bold text-[#3E2430]">NT$ {Math.ceil(baseTwd)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>代購服務費 ({rateConfig.serviceFeePercent}%)：</span>
              <span className="font-mono text-[#8A5A72]">NT$ {serviceFeeTwd}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-[#3E2430]">
              <span>商品代購總額 (不含國際運)：</span>
              <span className="font-mono text-base">NT$ {goodsTotalTwd}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>預估國際集運 ({estWeightKg}kg x NT${rateConfig.intlShippingPerKgTwd})：</span>
              <span className="font-mono text-[#8A5A72]">NT$ {intlShippingTwd}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>台灣國內超商運費：</span>
              <span className="font-mono text-[#8A5A72]">NT$ {domesticShippingTwd}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8A5A72]">預估到手總花費 (TWD)：</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#3E2430]">
                NT$ {grandTotalTwd}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#2E8B57] font-bold">安心訂金先付制</div>
              <div className="text-xs font-bold text-[#7D5569]">
                訂金只需 NT$ {estimatedDepositTwd}
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={onGoToShop}
              className="w-full py-3.5 rounded-2xl bg-[#FF6B8B] hover:bg-[#FA5276] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>前往【買東西這裡走】選購官方周邊 ➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rules & Assurance Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#F5CDDA] space-y-2 text-xs shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#FFE4ED] text-[#FA5276] flex items-center justify-center font-bold">
            🐾 1
          </div>
          <h4 className="font-bold text-[#3E2430] text-sm">西山居官方旗艦店授權</h4>
          <p className="text-[#8A5A72] leading-relaxed">
            所有商品皆於西山居天貓旗艦店或官方同人商城正式下單，附清晰採購單據截圖與訂單號。
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#F5CDDA] space-y-2 text-xs shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#FFE4ED] text-[#FA5276] flex items-center justify-center font-bold">
            🐱 2
          </div>
          <h4 className="font-bold text-[#3E2430] text-sm">特典虛擬碼保障條款</h4>
          <p className="text-[#8A5A72] leading-relaxed">
            若購買包含遊戲內披風/背部掛件特典之設定集或商品，保證外盒全新封膜未拆，兌換碼刮卡安全送達。
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#F5CDDA] space-y-2 text-xs shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#FFE4ED] text-[#FA5276] flex items-center justify-center font-bold">
            🌸 3
          </div>
          <h4 className="font-bold text-[#3E2430] text-sm">加厚防撞加固包裝</h4>
          <p className="text-[#8A5A72] leading-relaxed">
            易損之壓克力立牌、色紙、畫冊皆使用雙層防震氣泡袋與硬紙箱加固，避免國際長途運送邊角碰撞。
          </p>
        </div>
      </div>
    </div>
  );
};
