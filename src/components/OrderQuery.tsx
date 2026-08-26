import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { proxyStore } from '../services/store';
import { 
  Search, Package, Clock, CheckCircle2, Truck, AlertCircle, 
  CreditCard, Send, Image as ImageIcon, Sparkles, MapPin, 
  Phone, User, ChevronRight, Copy, Check, Info, ShieldCheck, RefreshCw, Layers, ArrowLeft, ShoppingCart,
  Flame, Sword, Shield, Upload, X
} from 'lucide-react';

interface OrderQueryProps {
  initialQuery?: string;
  onOpenShop: () => void;
  onBackHome?: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
}

// Visual stepper configuration in JX3 style
const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: string; desc: string }[] = [
  { status: 'pending_payment', label: '1. 待付訂金', icon: '📝', desc: '訂單建立，等待買家匯款' },
  { status: 'payment_received', label: '2. 已收款項', icon: '💰', desc: '已核對帳款，準備拍下' },
  { status: 'procuring', label: '3. 官方採購中', icon: '🛍️', desc: '已向西山居官方旗艦店下單' },
  { status: 'warehouse_in', label: '4. 大陸集運中', icon: '📦', desc: '商品已送達大陸轉運集運倉' },
  { status: 'shipping_intl', label: '5. 國際空運中', icon: '✈️', desc: '已裝箱起飛，台灣海關清關中' },
  { status: 'arrived_tw', label: '6. 已抵台分檢', icon: '🚚', desc: '抵達台灣，準備打包店到店' },
  { status: 'shipped', label: '7. 已寄出/配達', icon: '✨', desc: '已寄出，附超商物流單號' },
];

export const OrderQuery: React.FC<OrderQueryProps> = ({ 
  initialQuery = '', 
  onOpenShop,
  onBackHome,
  onOpenCart,
  cartCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [searchedOrders, setSearchedOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick report payment last 5 digits & receipt screenshot
  const [last5Input, setLast5Input] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // Lightbox for explanation images
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleSearch = (q: string = searchQuery) => {
    const term = q.trim();
    if (!term) return;

    setIsLoading(true);
    setHasSearched(true);

    // Simulate query latency
    setTimeout(() => {
      const results = proxyStore.searchOrders(term);
      setSearchedOrders(results);
      if (results.length > 0) {
        setSelectedOrder(results[0]);
      } else {
        setSelectedOrder(null);
      }
      setIsLoading(false);
    }, 200);
  };

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReportLast5 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || (!last5Input.trim() && !receiptImage)) return;

    const existingImages = selectedOrder.explanationImages || [];
    const newImages = receiptImage ? [...existingImages, receiptImage] : existingImages;

    const updated = proxyStore.updateOrder(selectedOrder.id, {
      paymentAccountLast5: last5Input.trim() || selectedOrder.paymentAccountLast5,
      paymentStatus: 'deposit_paid',
      publicNotes: `${selectedOrder.publicNotes}\n[買家回報]: ${last5Input.trim() ? `匯款末五碼為「${last5Input.trim()}」` : ''}${receiptImage ? '（已附上轉帳明細截圖）' : ''}，待核對中。`,
      explanationImages: newImages,
    });

    if (updated) {
      setSelectedOrder(updated);
      setReportSuccess(`已成功回報匯款資訊${last5Input.trim() ? `「末五碼: ${last5Input.trim()}」` : ''}${receiptImage ? '（含轉帳截圖）' : ''}！核對後將即時更新狀態。`);
      setLast5Input('');
      setReceiptImage('');
      setTimeout(() => setReportSuccess(null), 4500);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    const idx = TIMELINE_STEPS.findIndex((s) => s.status === status);
    if (idx !== -1) return idx;
    if (status === 'completed') return TIMELINE_STEPS.length - 1;
    return 0;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Page Action Strip: Return to Home & View Cart */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E8C4C4]">
        {onBackHome && (
          <button
            onClick={onBackHome}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF5F5] text-[#8B1D1D] border border-[#FFCCC7] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#8B1D1D]" />
            <span>返回首頁</span>
          </button>
        )}

        <div className="text-center hidden sm:block">
          <h2 className="text-base font-extrabold text-[#8B1D1D] tracking-wide flex items-center justify-center gap-1.5">
            <Sword className="w-4 h-4 text-[#C5922E]" />
            <span>包裡的錢終究是吹向了西山居</span>
          </h2>
          <span className="text-[11px] text-[#8C3636] font-medium">訂單視覺化進度與備註查詢</span>
        </div>

        {onOpenCart && (
          <button
            onClick={onOpenCart}
            className="px-4 py-2 rounded-xl bg-[#8B1D1D] hover:bg-[#731414] text-white border border-[#FFD875]/40 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-[#FFD875]" />
            <span>代購單</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FFD875] text-[#8B1D1D] font-extrabold text-[11px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Header Banner - Tiance Red (天策紅) Wuxia Styling */}
      <div className="p-6 sm:p-8 rounded-2xl bg-linear-to-r from-[#8B1D1D] via-[#751616] to-[#4F0B0B] text-white shadow-md border border-[#FFD875]/40 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C52828]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#FFD875] text-xs font-extrabold uppercase tracking-wider mb-1.5">
            <Flame className="w-4 h-4 text-[#FFD875]" />
            <span>天策府速報・西山居周邊進度查詢</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
            進度流程圖與店主備註查詢
          </h2>
          <p className="text-xs sm:text-sm text-[#FFEBEB] mt-1.5 leading-relaxed">
            輸入您的【買家暱稱】或【訂單編號 / 查詢碼】，即刻調用即時物流進度、店主備註說明與實拍圖！
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative z-10 mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8B1D1D]">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="order-query-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="請輸入買家暱稱 (例如: 太虛純陽一隻羊) 或訂單編號"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border-2 border-white/80 focus:border-[#FFD875] text-[#1E2530] placeholder-[#8A95A5] text-sm sm:text-base outline-none shadow-md transition-all font-medium"
            />
          </div>

          <button
            id="order-query-submit-btn"
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-7 py-3 rounded-xl bg-[#C5922E] hover:bg-[#B88224] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer border border-[#FFD875]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>調用中...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>即刻查詢</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Search Chips */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#FFEBEB] font-bold">快速範例：</span>
          {['太虛純陽一隻羊', '藏劍山莊大莊主', '萬花谷離經小仙女', '天策府哈士奇將軍'].map((name) => (
            <button
              key={name}
              onClick={() => {
                setSearchQuery(name);
                handleSearch(name);
              }}
              className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-[#FFF5F5] border border-white/20 transition-colors cursor-pointer font-medium"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Query Results */}
      {hasSearched && (
        <div className="space-y-6">
          {searchedOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-[#FFCCC7] text-[#6B7280] space-y-3 shadow-xs">
              <AlertCircle className="w-10 h-10 mx-auto text-[#8B1D1D]" />
              <div>
                <h3 className="text-base font-bold text-[#8B1D1D]">查無符合的訂單資料</h3>
                <p className="text-xs text-[#6B7280] mt-1 max-w-md mx-auto">
                  請確認輸入的暱稱或訂單編號是否正確。若剛填單，請稍候重試或聯絡確認！
                </p>
              </div>
              <button
                onClick={onOpenShop}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D1D] text-white font-bold text-xs cursor-pointer shadow-xs hover:bg-[#731414] border border-[#FFD875]/40"
              >
                前往【買東西這裡走】選購
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* If multiple orders found for same nickname */}
              {searchedOrders.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs text-[#8B1D1D] shrink-0 font-extrabold">找到 {searchedOrders.length} 筆訂單：</span>
                  {searchedOrders.map((ord) => (
                    <button
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                        selectedOrder?.id === ord.id
                          ? 'bg-[#8B1D1D] text-white border-[#8B1D1D] shadow-xs'
                          : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FFF5F5]'
                      }`}
                    >
                      {ord.id} ({ord.items[0]?.productName.substring(0, 8)}...)
                    </button>
                  ))}
                </div>
              )}

              {/* Order Detail View Card */}
              {selectedOrder && (
                <div className="bg-white rounded-2xl border border-[#E8C4C4] overflow-hidden shadow-sm space-y-6">
                  {/* Card Header */}
                  <div className="p-6 sm:p-7 bg-[#FFF9F9] border-b border-[#E8C4C4] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#8B1D1D]">訂單編號：</span>
                        <span className="text-base sm:text-lg font-mono font-extrabold text-[#1E2530]">
                          {selectedOrder.id}
                        </span>
                        <button
                          onClick={() => handleCopy(selectedOrder.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-[#FFF5F5] text-[#8B1D1D] border border-[#FFCCC7] transition-colors cursor-pointer"
                          title="複製訂單號"
                        >
                          {copiedId === selectedOrder.id ? (
                            <Check className="w-3.5 h-3.5 text-[#2E8B57]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-[#6B7280] flex items-center gap-3">
                        <span>買家暱稱：<strong className="text-[#1E2530]">{selectedOrder.buyerNickname}</strong></span>
                        <span>•</span>
                        <span>下單時間：{selectedOrder.createdAt}</span>
                      </div>
                    </div>

                    {/* Status Badge - Tiance Red */}
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-[#8B1D1D] text-white border border-[#FFD875]/40 shadow-xs">
                        {(() => {
                          const s = TIMELINE_STEPS.find((st) => st.status === selectedOrder.status);
                          return s ? `${s.icon} ${s.label}` : selectedOrder.status;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Requirement: 看到進度圖與備註 (Visual Progress Diagram / Stepper) */}
                  <div className="px-6 sm:px-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#8B1D1D] flex items-center gap-2">
                        <Flame className="w-4 h-4 text-[#8B1D1D]" />
                        <span>訂單視覺化進度圖</span>
                      </h3>
                      <span className="text-xs text-[#6B7280]">
                        最近更新：{selectedOrder.updatedAt}
                      </span>
                    </div>

                    {/* Stepper Card in Tiance Red Styling */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#FFF9F9] border border-[#E8C4C4] overflow-x-auto shadow-2xs">
                      <div className="min-w-[620px] relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-6 right-6 h-1.5 bg-[#E8C4C4] z-0 rounded-full">
                          <div 
                            className="h-full bg-[#8B1D1D] transition-all duration-500 rounded-full"
                            style={{
                              width: `${(getStepIndex(selectedOrder.status) / (TIMELINE_STEPS.length - 1)) * 100}%`
                            }}
                          />
                        </div>

                        {/* Step Nodes */}
                        <div className="relative z-10 flex justify-between">
                          {TIMELINE_STEPS.map((step, idx) => {
                            const currentIdx = getStepIndex(selectedOrder.status);
                            const isPast = idx < currentIdx;
                            const isCurrent = idx === currentIdx;

                            return (
                              <div key={step.status} className="flex flex-col items-center text-center w-20">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold transition-all shadow-xs ${
                                    isCurrent
                                      ? 'bg-[#8B1D1D] text-white ring-4 ring-[#8B1D1D]/30 scale-110'
                                      : isPast
                                      ? 'bg-[#4F0B0B] text-[#FFD875] border border-[#8B1D1D]/40'
                                      : 'bg-white text-[#A0AEC0] border border-[#E8C4C4]'
                                  }`}
                                >
                                  {isPast ? '✓' : step.icon}
                                </div>
                                <div className={`mt-2 text-xs font-bold ${
                                  isCurrent ? 'text-[#8B1D1D] font-extrabold' : isPast ? 'text-[#4F0B0B]' : 'text-[#A0AEC0]'
                                }`}>
                                  {step.label}
                                </div>
                                <div className="text-[10px] text-[#6B7280] mt-0.5 line-clamp-2 leading-tight">
                                  {step.desc}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Public Notes & Logistics Info */}
                  <div className="px-6 sm:px-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Public Notes Box */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F9] border border-[#E8C4C4] space-y-2">
                        <div className="flex items-center gap-1.5 text-[#8B1D1D] font-extrabold text-xs">
                          <Info className="w-4 h-4 text-[#8B1D1D]" />
                          <span>【進度備註 / 最新公告】</span>
                        </div>
                        <div className="text-xs sm:text-sm text-[#2D3748] whitespace-pre-line leading-relaxed bg-white p-3.5 rounded-xl border border-[#E8C4C4] shadow-2xs">
                          {selectedOrder.publicNotes || '暫無特殊備註，訂單正常推進中。'}
                        </div>
                      </div>

                      {/* Logistics & Tracking Box */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F9] border border-[#E8C4C4] space-y-2">
                        <div className="flex items-center justify-between text-[#8B1D1D] font-extrabold text-xs">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-[#8B1D1D]" />
                            <span>【物流與寄送資訊】</span>
                          </div>
                          {selectedOrder.trackingNumber && (
                            <span className="text-[11px] font-mono bg-white text-[#8B1D1D] font-bold px-2 py-0.5 rounded border border-[#FFCCC7]">
                              單號: {selectedOrder.trackingNumber}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-[#4A5568] space-y-1.5 bg-white p-3.5 rounded-xl border border-[#E8C4C4] shadow-2xs">
                          <div className="flex justify-between">
                            <span className="text-[#6B7280]">配送方式：</span>
                            <span className="font-bold text-[#1E2530]">
                              {selectedOrder.shippingMethod === '7-11' ? '7-11 超商取貨' : selectedOrder.shippingMethod === 'family_mart' ? '全家便利商店' : '宅配到府'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B7280]">門市/地址：</span>
                            <span className="font-bold text-[#1E2530]">{selectedOrder.shippingAddress}</span>
                          </div>
                          {selectedOrder.estimatedArrival && (
                            <div className="flex justify-between text-[#2E8B57]">
                              <span>預估抵達：</span>
                              <span className="font-bold">{selectedOrder.estimatedArrival}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Items Breakdown */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-extrabold text-[#8B1D1D] flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#8B1D1D]" />
                        訂單明細
                      </h4>

                      <div className="divide-y divide-[#E8C4C4] rounded-2xl bg-[#FFF9F9] border border-[#E8C4C4] overflow-hidden">
                        {selectedOrder.items.map((item, i) => (
                          <div key={i} className="p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
                            <img
                              src={item.coverImage}
                              alt={item.productName}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-[#E8C4C4] shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs sm:text-sm text-[#1E2530] truncate">
                                {item.productName}
                              </h5>
                              <p className="text-xs text-[#8B1D1D] font-medium mt-0.5">
                                規格：{item.selectedSpecsText}
                              </p>
                              <p className="text-[11px] text-[#6B7280] mt-0.5">
                                數量：x{item.quantity} ｜ 單品預估：NT$ {item.priceTwd}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-extrabold text-[#8B1D1D]">
                                NT$ {item.priceTwd * item.quantity}
                              </div>
                              <div className="text-[11px] text-[#6B7280]">
                                訂金: NT$ {item.depositTwd * item.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary & Payment Status */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8C4C4] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-[#6B7280]">款項狀態結算：</div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            selectedOrder.paymentStatus === 'fully_paid'
                              ? 'bg-[#E8F8F0] text-[#2E8B57] border border-[#C6EAD7]'
                              : selectedOrder.paymentStatus === 'deposit_paid'
                              ? 'bg-[#FFF3E0] text-[#B86200] border border-[#FFE0B2]'
                              : 'bg-[#FFF2F0] text-[#CF1322] border border-[#FFCCC7]'
                          }`}>
                            {selectedOrder.paymentStatus === 'fully_paid'
                              ? '已全額結清'
                              : selectedOrder.paymentStatus === 'deposit_paid'
                              ? '已付訂金，待付尾款'
                              : '待付訂金'}
                          </span>
                          {selectedOrder.paymentAccountLast5 && (
                            <span className="text-xs text-[#4A5568]">
                              末五碼: <strong className="text-[#1E2530] font-mono">{selectedOrder.paymentAccountLast5}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="text-xs text-[#6B7280]">
                          總額 NT$ {selectedOrder.totalTwd} + 運費 NT$ {selectedOrder.shippingFeeTwd}
                        </div>
                        <div className="text-sm sm:text-base font-extrabold text-[#1E2530]">
                          已付訂金: <span className="text-[#2E8B57]">NT$ {selectedOrder.depositTwd}</span> ｜ 
                          待付尾款: <span className="text-[#8B1D1D]">NT$ {selectedOrder.remainingTwd}</span>
                        </div>
                      </div>
                    </div>

                    {/* Explanation Images Gallery */}
                    {selectedOrder.explanationImages && selectedOrder.explanationImages.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-extrabold text-[#8B1D1D] flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-[#8B1D1D]" />
                          說明圖與採購實拍進度圖（點擊放大）
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {selectedOrder.explanationImages.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage(imgUrl)}
                              className="group relative aspect-video sm:aspect-square rounded-xl overflow-hidden bg-[#FFF9F9] border border-[#E8C4C4] cursor-pointer hover:border-[#8B1D1D] transition-all shadow-xs"
                            >
                              <img
                                src={imgUrl}
                                alt={`進度說明圖 ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-[#8B1D1D]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity">
                                點擊放大
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Report Last 5 digits Form */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F9] border border-[#E8C4C4] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-[#8B1D1D] flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#8B1D1D]" />
                          買家匯款末五碼與轉帳明細回報
                        </h4>
                        <span className="text-[11px] text-[#6B7280]">匯款完成後請在此回報以便核對</span>
                      </div>

                      {reportSuccess && (
                        <div className="p-2.5 rounded-xl bg-[#E8F8F0] border border-[#2E8B57]/30 text-[#2E8B57] text-xs font-bold">
                          {reportSuccess}
                        </div>
                      )}

                      <form onSubmit={handleReportLast5} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            maxLength={10}
                            value={last5Input}
                            onChange={(e) => setLast5Input(e.target.value)}
                            placeholder="請輸入您轉帳帳號的末五碼 (例如: 88219)"
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8C4C4] text-[#1E2530] text-xs sm:text-sm placeholder-[#8A95A5] focus:border-[#8B1D1D] outline-none font-medium"
                          />

                          <label className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#8B1D1D] border border-[#E8C4C4] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0">
                            <Upload className="w-4 h-4" />
                            <span>{receiptImage ? '已附加轉帳截圖' : '上傳轉帳明細圖'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const base64 = ev.target?.result as string;
                                    if (base64) {
                                      setReceiptImage(base64);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-[#8B1D1D] hover:bg-[#731414] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all shrink-0 cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>提交回報</span>
                          </button>
                        </div>

                        {receiptImage && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#E8C4C4]">
                            <img
                              src={receiptImage}
                              alt="轉帳明細截圖"
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-[#E8C4C4]"
                            />
                            <span className="text-xs text-[#2E8B57] font-bold flex-1">已成功選取轉帳截圖（免圖床直接上傳）</span>
                            <button
                              type="button"
                              onClick={() => setReceiptImage('')}
                              className="text-xs text-[#A63434] hover:underline p-1 cursor-pointer font-bold"
                            >
                              ✕ 移除截圖
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>

                  <div className="p-5 bg-[#FFF9F9] border-t border-[#E8C4C4] text-center text-xs text-[#8C3636] font-medium">
                    如對訂單有任何疑問，可隨時聯絡並提供訂單編號以加速查詢處理！
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img
              src={previewImage}
              alt="放大說明圖"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-[#1E2530] font-bold text-sm flex items-center justify-center shadow-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

