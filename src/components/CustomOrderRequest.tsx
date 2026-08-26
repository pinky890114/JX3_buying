import React, { useState } from 'react';
import { proxyStore } from '../services/store';
import { Order } from '../types';
import { ImageUpload } from './Common/ImageUpload';
import confetti from 'canvas-confetti';
import { ExternalLink, Send, ArrowRight, CheckCircle2, User, Phone, MapPin, Sparkles, HelpCircle, Cat, Heart } from 'lucide-react';

interface CustomOrderRequestProps {
  onOrderCreated: (orderId: string) => void;
}

export const CustomOrderRequest: React.FC<CustomOrderRequestProps> = ({ onOrderCreated }) => {
  const [productUrl, setProductUrl] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productImage, setProductImage] = useState('');
  const [specRequirement, setSpecRequirement] = useState('');
  const [estimatedRmb, setEstimatedRmb] = useState<number>(100);
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerNickname, setBuyerNickname] = useState('');
  const [contactMethod, setContactMethod] = useState<'line' | 'discord' | 'facebook' | 'phone'>('line');
  const [contactValue, setContactValue] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'7-11' | 'family_mart' | 'home_delivery'>('7-11');
  const [shippingAddress, setShippingAddress] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const calculatedTwd = proxyStore.calculateTwd(estimatedRmb * quantity);
  const depositTwd = Math.ceil(calculatedTwd * 0.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productUrl.trim() || !productTitle.trim() || !buyerNickname.trim() || !contactValue.trim()) {
      alert('請填寫完整商品網址、品名、買家暱稱與聯絡資訊！');
      return;
    }

    const newOrder = proxyStore.createOrder({
      queryCode: `CUST${Math.floor(1000 + Math.random() * 9000)}`,
      buyerNickname: buyerNickname.trim(),
      contactMethod,
      contactValue: contactValue.trim(),
      shippingMethod,
      shippingAddress: shippingAddress.trim() || '未填寫門市，後續私訊補齊',
      items: [
        {
          productId: `custom-${Date.now()}`,
          productName: `【客製自選】${productTitle.trim()}`,
          coverImage: productImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&auto=format&fit=crop&q=80',
          selectedSpecsText: `規格需求：${specRequirement.trim() || '依商品網址'} (商品網址: ${productUrl.trim()})`,
          quantity,
          priceRmb: estimatedRmb,
          priceTwd: calculatedTwd,
          depositTwd,
        },
      ],
      totalRmb: estimatedRmb * quantity,
      totalTwd: calculatedTwd,
      depositTwd,
      remainingTwd: calculatedTwd - depositTwd + 60,
      shippingFeeTwd: 60,
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      publicNotes: `🔗 客製自選商品已登記！\n網址：${productUrl.trim()}\n需求款式：${specRequirement.trim()}\n請於核對報價後匯款訂金 NT$ ${depositTwd} 並於查詢系統回報。`,
      adminNotes: `客製自選登記，商品網址: ${productUrl.trim()}`,
      explanationImages: [productImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&auto=format&fit=crop&q=80'],
    });

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (_) {}

    setCreatedOrder(newOrder);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#F5CDDA] shadow-xs">
        <div className="flex items-center gap-2 text-[#FA5276] text-xs font-bold uppercase tracking-wider mb-1">
          <Cat className="w-4 h-4" />
          <span>【自選網址客製委託】🐾</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3E2430]">
          貼上任何西山居 / 淘寶商城周邊網址
        </h2>
        <p className="text-sm text-[#8A5A72] mt-2">
          想買的品項沒在展示選單中？在此貼上商品連結與規格說明，店主將迅速為您核價並建立專屬追蹤訂單！
        </p>
      </div>

      {createdOrder ? (
        <div className="p-8 rounded-3xl bg-white border border-[#F5CDDA] text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#2E8B57] border border-[#2E8B57]/30 flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#3E2430]">客製委託訂單已成功建立！🐾</h3>
            <p className="text-xs text-[#8A5A72] mt-1">
              專屬訂單編號：<strong className="text-[#FA5276] font-mono text-base">{createdOrder.id}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#8A5A72]">買家暱稱：</span>
              <span className="font-bold text-[#3E2430]">{createdOrder.buyerNickname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A5A72]">品項：</span>
              <span className="font-bold text-[#FA5276]">{createdOrder.items[0]?.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A5A72]">預估訂金：</span>
              <span className="font-bold text-[#2E8B57]">NT$ {createdOrder.depositTwd}</span>
            </div>
          </div>

          <button
            onClick={() => onOrderCreated(createdOrder.id)}
            className="w-full py-3.5 rounded-2xl bg-[#FF6B8B] hover:bg-[#FA5276] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>立即前往【訂單進度查詢】</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-[#F5CDDA] space-y-4 text-xs sm:text-sm shadow-xs">
          <div className="space-y-1">
            <label className="font-bold text-[#3E2430]">
              商品購買網址 (淘寶/天貓/西山居旗艦店網址) <strong className="text-[#FA5276]">*</strong>
            </label>
            <input
              type="url"
              required
              placeholder="https://detail.tmall.com/item.htm?id=..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] focus:border-[#FA5276] text-[#3E2430] placeholder-[#A07B8E] outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#3E2430]">
              商品品名與描述 <strong className="text-[#FA5276]">*</strong>
            </label>
            <input
              type="text"
              required
              placeholder="例如: 劍網3 十二門派同人金屬書籤套裝"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] focus:border-[#FA5276] text-[#3E2430] placeholder-[#A07B8E] outline-none transition-colors"
            />
          </div>

          {/* Product Picture Direct Upload */}
          <div className="space-y-1">
            <ImageUpload
              label="商品截圖 / 實品照片 (可直接從相簿或電腦上傳)"
              value={productImage}
              onChange={(val) => setProductImage(val)}
              previewSize="md"
              placeholder="或貼上商品圖片網址 (選填)"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#3E2430]">
              指定規格 / 門派 / 尺寸 / 款式需求
            </label>
            <textarea
              rows={2}
              placeholder="例如: 純陽款 1 個 + 萬花款 1 個，需附特典卡"
              value={specRequirement}
              onChange={(e) => setSpecRequirement(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] placeholder-[#A07B8E] outline-none resize-none focus:border-[#FA5276] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#3E2430]">預估單價 (¥ RMB)</label>
              <input
                type="number"
                min="1"
                required
                value={estimatedRmb}
                onChange={(e) => setEstimatedRmb(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] font-mono font-bold outline-none focus:border-[#FA5276]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#3E2430]">委託數量</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] font-bold outline-none focus:border-[#FA5276]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#F5CDDA] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#3E2430]">買家暱稱 / ID <strong className="text-[#FA5276]">*</strong></label>
              <input
                type="text"
                required
                placeholder="用於進度查詢的暱稱"
                value={buyerNickname}
                onChange={(e) => setBuyerNickname(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] placeholder-[#A07B8E] outline-none focus:border-[#FA5276]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#3E2430]">聯絡通訊 (LINE / Discord) <strong className="text-[#FA5276]">*</strong></label>
              <input
                type="text"
                required
                placeholder="例如: LINE ID 或 Discord"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] placeholder-[#A07B8E] outline-none focus:border-[#FA5276]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#3E2430]">台灣收件超商 (7-11 或全家門市)</label>
            <input
              type="text"
              placeholder="例如: 7-11 萬華門市 (店號: 198273)"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] placeholder-[#A07B8E] outline-none focus:border-[#FA5276]"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] flex justify-between items-center text-xs">
            <div>
              <span className="text-[#8A5A72]">折合台幣預估總額：</span>
              <span className="font-bold text-[#3E2430] text-base ml-1">NT$ {calculatedTwd}</span>
            </div>
            <div>
              <span className="text-[#FA5276] font-bold">預估訂金：NT$ {depositTwd}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#FF6B8B] hover:bg-[#FA5276] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>送出客製代購委託登記</span>
          </button>
        </form>
      )}
    </div>
  );
};
