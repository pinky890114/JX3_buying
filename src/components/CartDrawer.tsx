import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { proxyStore } from '../services/store';
import confetti from 'canvas-confetti';
import { 
  ShoppingBag, Trash2, ArrowRight, CheckCircle2, Copy, 
  Check, X, Truck, CreditCard, Send, Sparkles, MapPin, User, Package
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, qty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOrderCreated: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [buyerNickname, setBuyerNickname] = useState('');
  const [contactMethod, setContactMethod] = useState<'line' | 'discord' | 'facebook' | 'phone' | 'email'>('line');
  const [contactValue, setContactValue] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'7-11' | 'family_mart' | 'home_delivery' | 'meetup'>('7-11');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderRemarks, setOrderRemarks] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalRmb = cartItems.reduce((sum, item) => sum + item.unitPriceRmb * item.quantity, 0);
  const totalTwd = cartItems.reduce((sum, item) => sum + item.unitPriceTwd * item.quantity, 0);
  const totalDepositTwd = cartItems.reduce((sum, item) => sum + item.depositTwd * item.quantity, 0);
  const shippingFeeTwd = shippingMethod === 'meetup' ? 0 : 60;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerNickname.trim() || !contactValue.trim() || !shippingAddress.trim()) {
      alert('請填寫完整買家暱稱、聯絡帳號與超商門市/收件資訊！');
      return;
    }

    const orderItems = cartItems.map((c) => ({
      productId: c.productId,
      productName: c.productName,
      coverImage: c.coverImage,
      selectedSpecsText: Object.values(c.selectedSpecs).map((s: any) => s?.name).filter(Boolean).join(' / '),
      quantity: c.quantity,
      priceRmb: c.unitPriceRmb,
      priceTwd: c.unitPriceTwd,
      depositTwd: c.depositTwd,
    }));

    const newOrder = proxyStore.createOrder({
      queryCode: `XSJ${Math.floor(1000 + Math.random() * 9000)}`,
      buyerNickname: buyerNickname.trim(),
      contactMethod,
      contactValue: contactValue.trim(),
      shippingMethod,
      shippingAddress: shippingAddress.trim(),
      items: orderItems,
      totalRmb,
      totalTwd,
      depositTwd: totalDepositTwd,
      remainingTwd: (totalTwd - totalDepositTwd) + shippingFeeTwd,
      shippingFeeTwd,
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      publicNotes: orderRemarks 
        ? `📝 買家委託備註: ${orderRemarks}\n💳 訂單已建立，請於 48 小時內匯款訂金 NT$ ${totalDepositTwd} 並於查詢頁回報末五碼。`
        : `💳 訂單已建立，請於 48 小時內匯款訂金 NT$ ${totalDepositTwd} 並於查詢頁回報末五碼。`,
      adminNotes: `買家自填單下單。`,
      explanationImages: cartItems.map((c) => c.coverImage).slice(0, 2),
    });

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    setCreatedOrder(newOrder);
    onClearCart();
    setIsCheckingOut(false);
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#F5F2EB] border-l border-[#DDD5C7] text-[#1E2530] h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#DDD5C7] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#223147] flex items-center justify-center text-[#C5922E]">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#1E2530]">
              {createdOrder ? '訂單提交成功' : isCheckingOut ? '確認並填寫代購委託單' : '我的代購商品清單'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#6B7280] cursor-pointer transition-colors border border-[#DDD5C7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {createdOrder ? (
            /* Order Created Success View */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F8F0] border border-[#2E8B57]/30 text-[#2E8B57] flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#1E2530]">代購訂單已成功建立</h4>
                <p className="text-xs text-[#6B7280] mt-1">
                  您的訂單資料已同步，可於【訂單進度查詢】隨時輸入暱稱追蹤！
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] text-left space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280] font-semibold">專屬訂單編號：</span>
                  <button
                    onClick={() => handleCopyOrderId(createdOrder.id)}
                    className="flex items-center gap-1 text-xs text-[#C5922E] font-bold hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#2E8B57]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已複製' : '複製單號'}</span>
                  </button>
                </div>
                <div className="text-base font-mono font-bold text-[#1E2530]">
                  {createdOrder.id}
                </div>
                <div className="text-xs text-[#6B7280] pt-2 border-t border-[#DDD5C7] flex justify-between">
                  <span>買家暱稱: <strong className="text-[#1E2530]">{createdOrder.buyerNickname}</strong></span>
                  <span>應付訂金: <strong className="text-[#2E8B57] font-bold">NT$ {createdOrder.depositTwd}</strong></span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs text-[#4A5568] text-left space-y-1">
                <p className="font-bold text-[#1E2530]">下一步匯款指引：</p>
                <p>1. 請將訂金 NT$ {createdOrder.depositTwd} 匯入指定帳戶。</p>
                <p>2. 匯款後，前往【訂單進度查詢】回報帳號末五碼。</p>
              </div>

              <button
                onClick={() => {
                  onOrderCreated(createdOrder.id);
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border border-[#C5922E]"
              >
                <span>前往【訂單進度查詢】查看進度圖</span>
                <ArrowRight className="w-4 h-4 text-[#C5922E]" />
              </button>
            </div>
          ) : isCheckingOut ? (
            /* Checkout Form */
            <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-[#1E2530] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#C5922E]" />
                  <span>買家暱稱 / ID <strong className="text-red-500">*</strong></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 太虛純陽一隻羊、藏劍大少爺"
                  value={buyerNickname}
                  onChange={(e) => setBuyerNickname(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DDD5C7] focus:border-[#C5922E] text-[#1E2530] outline-none"
                />
                <span className="text-[10px] text-[#6B7280]">此暱稱將用於後續「訂單進度查詢」，請牢記！</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">聯絡通訊軟體</label>
                  <select
                    value={contactMethod}
                    onChange={(e: any) => setContactMethod(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DDD5C7] text-[#1E2530] outline-none cursor-pointer"
                  >
                    <option value="line">LINE</option>
                    <option value="discord">Discord</option>
                    <option value="facebook">Facebook / 噗浪</option>
                    <option value="phone">手機電話</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">聯絡帳號 <strong className="text-red-500">*</strong></label>
                  <input
                    type="text"
                    required
                    placeholder="LINE ID / Discord tag"
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DDD5C7] text-[#1E2530] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530] flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#C5922E]" />
                  <span>國內配送方式</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '7-11', label: '7-11 店到店 ($60)' },
                    { id: 'family_mart', label: '全家店到店 ($60)' },
                    { id: 'home_delivery', label: '宅配 ($100)' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setShippingMethod(m.id as any)}
                      className={`p-2 rounded-xl text-center border font-bold text-xs cursor-pointer transition-colors ${
                        shippingMethod === m.id
                          ? 'bg-[#223147] border-[#C5922E] text-white shadow-xs'
                          : 'bg-white border-[#DDD5C7] text-[#4A5568] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C5922E]" />
                  <span>取件門市名稱與店號 / 收件地址 <strong className="text-red-500">*</strong></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 7-11 萬華門市 (店號: 198273)"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DDD5C7] focus:border-[#C5922E] text-[#1E2530] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">委託特別備註（選填）</label>
                <textarea
                  rows={2}
                  placeholder="例如: 需保留原廠紙盒防折、特典卡請小心包裝..."
                  value={orderRemarks}
                  onChange={(e) => setOrderRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DDD5C7] text-[#1E2530] outline-none resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[#DDD5C7] space-y-1 text-xs text-[#4A5568]">
                <div className="flex justify-between">
                  <span>商品總額 ({cartItems.length} 項)：</span>
                  <span className="font-bold text-[#1E2530]">NT$ {totalTwd}</span>
                </div>
                <div className="flex justify-between text-[#2E8B57] font-bold">
                  <span>本次需付訂金：</span>
                  <span>NT$ {totalDepositTwd}</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>到台待付尾款 + 運費：</span>
                  <span>NT$ {(totalTwd - totalDepositTwd) + shippingFeeTwd}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-white border border-[#DDD5C7] text-[#4A5568] font-bold text-xs cursor-pointer hover:bg-[#FAF7F2]"
                >
                  返回清單
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C5922E] hover:bg-[#B88224] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>確認送出代購單</span>
                </button>
              </div>
            </form>
          ) : cartItems.length === 0 ? (
            /* Empty Cart */
            <div className="text-center py-16 text-[#8A95A5] space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-[#DDD5C7]" />
              <p className="text-sm font-semibold text-[#1E2530]">代購清單目前是空的</p>
              <p className="text-xs text-[#6B7280]">快去【買東西這裡走】挑選喜歡的西山居周邊吧！</p>
            </div>
          ) : (
            /* Items List */
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3 rounded-2xl bg-white border border-[#DDD5C7] flex gap-3 items-center shadow-xs"
                >
                  <img
                    src={item.coverImage}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-[#DDD5C7] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm text-[#1E2530] truncate">
                      {item.productName}
                    </h5>
                    <p className="text-[11px] text-[#C5922E] font-medium truncate mt-0.5">
                      {Object.values(item.selectedSpecs).map((s: any) => s?.name).filter(Boolean).join(' / ')}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1E2530]">
                        NT$ {item.unitPriceTwd * item.quantity}
                        <span className="text-[10px] text-[#6B7280] font-normal ml-1">
                          (訂金 NT$ {item.depositTwd * item.quantity})
                        </span>
                      </span>

                      {/* Qty changer */}
                      <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-[#DDD5C7]">
                        <button
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-4 h-4 text-[#4A5568] hover:text-[#1E2530] flex items-center justify-center font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-[#1E2530] px-1">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-4 h-4 text-[#4A5568] hover:text-[#1E2530] flex items-center justify-center font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.cartItemId)}
                    className="p-2 text-[#8A95A5] hover:text-red-500 transition-colors cursor-pointer"
                    title="移除品項"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer for non-checking out */}
        {!createdOrder && !isCheckingOut && cartItems.length > 0 && (
          <div className="p-5 border-t border-[#DDD5C7] bg-white space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-[#6B7280]">預估總額 (不含國內運費)：</span>
              <span className="text-lg font-bold text-[#1E2530]">NT$ {totalTwd}</span>
            </div>
            <div className="flex justify-between text-xs text-[#4A5568]">
              <span>訂金合計：</span>
              <span className="font-bold text-[#2E8B57]">NT$ {totalDepositTwd}</span>
            </div>
            <button
              onClick={() => setIsCheckingOut(true)}
              className="w-full py-3 rounded-xl bg-[#C5922E] hover:bg-[#B88224] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>前往填寫寄送資料</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

