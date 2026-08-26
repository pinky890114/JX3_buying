import React, { useState, useRef } from 'react';
import { Order, OrderStatus } from '../../types';
import { proxyStore } from '../../services/store';
import { 
  X, Check, Clock, Edit3, Image as ImageIcon, Plus, 
  Trash2, Copy, Send, Truck, CreditCard, User, Package, 
  ShieldCheck, AlertCircle, Sparkles, ExternalLink, Cat, Heart, Upload, Loader2
} from 'lucide-react';

interface OrderEditModalProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
}

const ALL_STATUSES: { id: OrderStatus; label: string; color: string; desc: string }[] = [
  { id: 'pending_payment', label: '待付款 (未付訂金)', color: 'bg-[#FFF0F0] text-[#E0245E] border-[#FA5276]/30', desc: '等待買家匯款訂金' },
  { id: 'payment_received', label: '已收款 (訂金已收)', color: 'bg-[#FEF3D6] text-[#B26A00] border-[#B26A00]/20', desc: '已核對款項，準備下單' },
  { id: 'procuring', label: '官方採購中', color: 'bg-[#FFF5F8] text-[#FA5276] border-[#F5CDDA]', desc: '已向西山居官方旗艦店拍下' },
  { id: 'warehouse_in', label: '抵達大陸集運倉', color: 'bg-[#F3E8FD] text-[#8B5CF6] border-[#8B5CF6]/20', desc: '大陸國內快遞已簽收秤重' },
  { id: 'shipping_intl', label: '國際轉運空運中', color: 'bg-[#FFE4ED] text-[#FA5276] border-[#F5CDDA]', desc: '已起飛轉運至台灣海關' },
  { id: 'arrived_tw', label: '已抵台分檢打包', color: 'bg-[#E8F8F0] text-[#2E8B57] border-[#2E8B57]/20', desc: '海關放行，台灣端準備寄出' },
  { id: 'shipped', label: '已寄出 (附單號)', color: 'bg-[#E8F8F0] text-[#2E8B57] border-[#2E8B57]/20', desc: '已於超商寄出，買家取貨中' },
  { id: 'completed', label: '交易完成', color: 'bg-[#FFF5F8] text-[#3E2430] border-[#F5CDDA]', desc: '買家已取貨且結清' },
  { id: 'cancelled', label: '已取消/已退款', color: 'bg-[#FFE4ED] text-[#8A5A72] border-[#F5CDDA]', desc: '委託取消或已全額退款' },
];

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  onClose,
  onOrderUpdated,
}) => {
  if (!order) return null;

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [publicNotes, setPublicNotes] = useState(order.publicNotes || '');
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [depositTwd, setDepositTwd] = useState(order.depositTwd);
  const [remainingTwd, setRemainingTwd] = useState(order.remainingTwd);
  const [paymentLast5, setPaymentLast5] = useState(order.paymentAccountLast5 || '');
  const [estimatedArrival, setEstimatedArrival] = useState(order.estimatedArrival || '');
  
  // Explanation Images state
  const [explanationImages, setExplanationImages] = useState<string[]>(order.explanationImages || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick preset explanation templates
  const PRESET_IMAGE_TEMPLATES = [
    {
      title: '官方下單採購截圖',
      url: 'https://images.unsplash.com/photo-1556742049-0a67e5577ff0?w=700&auto=format&fit=crop&q=80',
    },
    {
      title: '集運倉到貨實拍照',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=700&auto=format&fit=crop&q=80',
    },
    {
      title: '雙層氣泡加固包裝',
      url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=700&auto=format&fit=crop&q=80',
    },
    {
      title: '7-11寄件收據單',
      url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=700&auto=format&fit=crop&q=80',
    },
  ];

  const handleAddImage = (urlToAdd: string = newImageUrl) => {
    const url = urlToAdd.trim();
    if (!url) return;
    setExplanationImages((prev) => [...prev, url]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setExplanationImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = () => {
    const updated = proxyStore.updateOrder(order.id, {
      status: currentStatus,
      paymentStatus,
      publicNotes: publicNotes.trim(),
      adminNotes: adminNotes.trim(),
      trackingNumber: trackingNumber.trim(),
      depositTwd: Number(depositTwd),
      remainingTwd: Number(remainingTwd),
      paymentAccountLast5: paymentLast5.trim(),
      estimatedArrival: estimatedArrival.trim(),
      explanationImages,
    });

    if (updated) {
      onOrderUpdated(updated);
      setToastMessage('訂單詳情與狀態已成功保存！');
      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1000);
    }
  };

  // Quick formatted copy for Line/Discord
  const handleCopyLineReport = () => {
    const summaryText = `【包裡的錢終究是吹向了西山居 - 訂單進度更新通知】🐾
━━━━━━━━━━━━━━━━━━
📌 訂單編號：${order.id}
👤 買家暱稱：${order.buyerNickname}
📦 當前狀態：${ALL_STATUSES.find(s => s.id === currentStatus)?.label || currentStatus}
💰 款項狀態：已付訂金 NT$ ${depositTwd} / 待付尾款 NT$ ${remainingTwd}
🚚 物流資訊：${order.shippingMethod} ｜ ${order.shippingAddress}
${trackingNumber ? `🏷️ 物流單號：${trackingNumber}\n` : ''}📝 店主備註：${publicNotes}
━━━━━━━━━━━━━━━━━━
👉 可隨時至系統【訂單進度查詢】輸入「${order.buyerNickname}」查看即時進度圖與實拍照！`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-white border border-[#F5CDDA] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#3E2430] my-8 max-h-[92vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-8 right-8 z-50 bg-[#FF6B8B] text-white font-bold px-5 py-3 rounded-2xl shadow-xl animate-fade-in text-sm border border-[#FA5276]">
            {toastMessage}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#F5CDDA]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FF6B8B] uppercase tracking-wider flex items-center gap-1">
                <Cat className="w-3.5 h-3.5" />
                後台訂單管理詳情
              </span>
              <span className="text-xs text-[#8A5A72]">ID: {order.id}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#3E2430] mt-1">
              買家：{order.buyerNickname}（{order.contactMethod.toUpperCase()}: {order.contactValue}）
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLineReport}
              className="px-3 py-2 rounded-2xl bg-[#FFE4ED] hover:bg-[#FCD8E3] border border-[#F5CDDA] text-xs font-bold text-[#7D5569] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="複製格式化訊息給買家"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-[#2E8B57]" /> : <Copy className="w-4 h-4 text-[#FA5276]" />}
              <span>{copiedSummary ? '已複製通知文' : '一鍵複製買家通知'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFE4ED] hover:bg-[#FCD8E3] text-[#8A5A72] flex items-center justify-center font-bold cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Requirement: 可修改訂單狀態（待付款、已收款...） */}
        <div className="space-y-3 p-5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA]">
          <label className="text-xs sm:text-sm font-bold text-[#3E2430] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FA5276]" />
            <span>【修改訂單進度狀態】（點擊即可切換）</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ALL_STATUSES.map((st) => {
              const isSelected = currentStatus === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  id={`admin-set-status-${st.id}`}
                  onClick={() => {
                    setCurrentStatus(st.id);
                    if (st.id === 'payment_received' && paymentStatus === 'unpaid') {
                      setPaymentStatus('deposit_paid');
                    } else if (st.id === 'shipped' || st.id === 'completed') {
                      setPaymentStatus('fully_paid');
                    }
                  }}
                  className={`p-3 rounded-2xl text-left border transition-colors cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#FF6B8B] text-white border-[#FF6B8B] shadow-xs'
                      : 'bg-white border-[#F5CDDA] text-[#7D5569] hover:bg-[#FFE4ED]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{st.label}</span>
                    {isSelected && <span>✓</span>}
                  </div>
                  <span className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-white/90' : 'text-[#A07B8E]'}`}>
                    {st.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Items & Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-[#3E2430] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#FA5276]" />
            <span>訂購品項明細與金額</span>
          </h4>

          <div className="divide-y divide-[#F5CDDA] bg-[#FFF5F8] rounded-2xl border border-[#F5CDDA] overflow-hidden">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center gap-4">
                <img
                  src={item.coverImage}
                  alt={item.productName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover border border-[#F5CDDA] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[#3E2430] truncate">{item.productName}</div>
                  <div className="text-xs text-[#7D5569] mt-0.5">規格：{item.selectedSpecsText}</div>
                  <div className="text-xs text-[#8A5A72] mt-0.5">
                    數量: x{item.quantity} ｜ 單品: NT$ {item.priceTwd} (¥{item.priceRmb})
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#3E2430] text-sm">NT$ {item.priceTwd * item.quantity}</div>
                  <div className="text-[11px] text-[#8A5A72]">訂金: NT$ {item.depositTwd * item.quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial & Logistics Info Editing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Details */}
          <div className="p-5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] space-y-3">
            <h4 className="text-xs font-bold text-[#FA5276] uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>款項與帳號管理</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[#8A5A72]">款項結算狀態：</label>
                <select
                  value={paymentStatus}
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-white border border-[#F5CDDA] text-[#3E2430] outline-none"
                >
                  <option value="unpaid">待付款 (未付訂金)</option>
                  <option value="deposit_paid">已付訂金 (待補尾款)</option>
                  <option value="fully_paid">已付清全額 (含運費)</option>
                  <option value="refunded">已退款</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#8A5A72]">已收訂金 (TWD)：</label>
                  <input
                    type="number"
                    value={depositTwd}
                    onChange={(e) => setDepositTwd(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl bg-white border border-[#F5CDDA] text-[#3E2430] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#8A5A72]">待收尾款 (TWD)：</label>
                  <input
                    type="number"
                    value={remainingTwd}
                    onChange={(e) => setRemainingTwd(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl bg-white border border-[#F5CDDA] text-[#3E2430] outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8A5A72]">買家匯款帳號末五碼：</label>
                <input
                  type="text"
                  placeholder="例如: 88219"
                  value={paymentLast5}
                  onChange={(e) => setPaymentLast5(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-white border border-[#F5CDDA] text-[#3E2430] outline-none font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Logistics & Tracking */}
          <div className="p-5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] space-y-3">
            <h4 className="text-xs font-bold text-[#FA5276] uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>寄送與物流單號</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[#8A5A72]">收件門市 / 地址：</label>
                <div className="text-[#3E2430] font-medium bg-white p-2.5 rounded-xl border border-[#F5CDDA]">
                  {order.shippingMethod.toUpperCase()} ｜ {order.shippingAddress}
                </div>
              </div>

              <div>
                <label className="text-[#8A5A72]">國內外快遞單號 (超商取貨/順豐)：</label>
                <input
                  type="text"
                  placeholder="例如: TW711-88492019 或 SF198293"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-white border border-[#F5CDDA] text-[#3E2430] outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[#8A5A72]">預估抵達時間 (選填)：</label>
                <input
                  type="date"
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-white border border-[#F5CDDA] text-[#3E2430] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Requirement: 填寫備註 (Public & Admin Notes) */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-[#3E2430] flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-[#FA5276]" />
              <span>【公開給買家看的進度備註】（買家在查詢系統時立即可見）</span>
            </label>
            <textarea
              rows={3}
              placeholder="例如: 📦 貨品已順利抵達台灣集運分檢處！外箱完好，明天發出 7-11 店到店..."
              value={publicNotes}
              onChange={(e) => setPublicNotes(e.target.value)}
              className="w-full p-3 rounded-2xl bg-white border border-[#F5CDDA] text-[#3E2430] text-xs sm:text-sm outline-none resize-none focus:border-[#FA5276]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-[#8A5A72] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8A5A72]" />
              <span>【管理員內部私密備註】（僅後台可見，如淘寶拍下單號、供貨商聯絡）</span>
            </label>
            <textarea
              rows={2}
              placeholder="例如: 淘寶訂單號: 981293847192847，官方附贈兩張特典透卡。"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] text-xs outline-none resize-none"
            />
          </div>
        </div>

        {/* Requirement: 管理員可查看訂單詳情（包含清晰的說明圖） & 新增/管理說明圖 */}
        <div className="space-y-3 p-5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA]">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-[#3E2430] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#FA5276]" />
              <span>【訂單說明圖與採購證明圖庫】</span>
            </label>
            <span className="text-xs text-[#8A5A72]">目前共 {explanationImages.length} 張說明圖</span>
          </div>

          {/* Preset Template Fast Addition */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-[#8A5A72] font-semibold py-1">快速加入範例說明圖：</span>
            {PRESET_IMAGE_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddImage(tmpl.url)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FFE4ED] text-[#7D5569] border border-[#F5CDDA] transition-colors cursor-pointer"
              >
                + {tmpl.title}
              </button>
            ))}
          </div>

          {/* Custom URL add or Local file direct upload */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="請輸入說明圖 / 採購截圖之圖片 URL (https://...)"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 p-2.5 rounded-xl bg-white border border-[#F5CDDA] text-[#3E2430] text-xs outline-none focus:border-[#FA5276]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddImage()}
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#3E2430] border border-[#DDD5C7] font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>加入網址</span>
              </button>

              <label className="px-4 py-2.5 rounded-xl bg-[#FF6B8B] hover:bg-[#FA5276] text-white font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>從本機/手機上傳圖片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []) as File[];
                    files.forEach((file: File) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        if (base64) {
                          setExplanationImages((prev) => [...prev, base64]);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                />
              </label>
            </div>
          </div>

          {/* Images Grid */}
          {explanationImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {explanationImages.map((imgUrl, i) => (
                <div key={i} className="group relative aspect-video rounded-xl overflow-hidden bg-white border border-[#F5CDDA]">
                  <img
                    src={imgUrl}
                    alt={`說明圖 ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#E0245E] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="移除此圖片"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-[#F5CDDA] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#FFE4ED] hover:bg-[#FCD8E3] text-[#7D5569] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            id="admin-save-order-btn"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-2xl bg-[#FF6B8B] hover:bg-[#FA5276] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>儲存並同步訂單變更</span>
          </button>
        </div>
      </div>
    </div>
  );
};
