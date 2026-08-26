import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, Category, ProductItem, ProxyRateConfig } from '../../types';
import { proxyStore, AdminUser } from '../../services/store';
import { OrderEditModal } from './OrderEditModal';
import { CatalogManager } from './CatalogManager';
import { FinancialReport } from './FinancialReport';
import { 
  ShieldCheck, Search, Filter, RefreshCw, LogOut, Package, 
  CreditCard, Clock, Truck, CheckCircle2, AlertCircle, Edit3, 
  ExternalLink, Layers, DollarSign, Settings, Sparkles, Image as ImageIcon, Plus, ArrowLeft, BarChart3, Store
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AdminUser | null;
  onLogout: () => void;
  rateConfig: ProxyRateConfig;
  onUpdateRateConfig: (newRates: Partial<ProxyRateConfig>) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout,
  rateConfig,
  onUpdateRateConfig,
}) => {
  const [orders, setOrders] = useState<Order[]>(proxyStore.getOrders());
  const [categories, setCategories] = useState<Category[]>(proxyStore.getCategories());
  const [products, setProducts] = useState<ProductItem[]>(proxyStore.getProducts());

  // 4 Primary tabs: shops (店鋪管理), catalog (商品管理), orders (訂單管理), finance (財務報表)
  const [activeTab, setActiveTab] = useState<'shops' | 'catalog' | 'orders' | 'finance'>('shops');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEditingOrder, setSelectedEditingOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRateSettingsOpen, setIsRateSettingsOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState(proxyStore.getSyncStatus());

  // Rate inputs state
  const [exchangeRateInput, setExchangeRateInput] = useState(rateConfig.exchangeRate.toString());
  const [serviceFeeInput, setServiceFeeInput] = useState(rateConfig.serviceFeePercent.toString());
  const [shipping711Input, setShipping711Input] = useState(rateConfig.twDomesticShipping711.toString());

  // Listen to store updates
  React.useEffect(() => {
    const unsubscribe = proxyStore.subscribe(() => {
      setOrders(proxyStore.getOrders());
      setCategories(proxyStore.getCategories());
      setProducts(proxyStore.getProducts());
      setSyncStatus(proxyStore.getSyncStatus());
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await proxyStore.syncAllToFirebase();
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e: any) {
      setToastMessage(`同步失敗: ${e.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = orders.length;
    const pendingPayment = orders.filter((o) => o.status === 'pending_payment').length;
    const paymentReceived = orders.filter((o) => o.status === 'payment_received').length;
    const inTransit = orders.filter((o) => ['procuring', 'warehouse_in', 'shipping_intl', 'arrived_tw'].includes(o.status)).length;
    const shipped = orders.filter((o) => ['shipped', 'completed'].includes(o.status)).length;
    const totalTwd = orders.reduce((sum, o) => sum + o.totalTwd, 0);

    return { total, pendingPayment, paymentReceived, inTransit, shipped, totalTwd };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (statusFilter !== 'all' && ord.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const match =
          ord.id.toLowerCase().includes(q) ||
          ord.buyerNickname.toLowerCase().includes(q) ||
          ord.contactValue.toLowerCase().includes(q) ||
          (ord.trackingNumber && ord.trackingNumber.toLowerCase().includes(q)) ||
          ord.items.some((i) => i.productName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Quick inline status updater
  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = proxyStore.updateOrderStatus(orderId, newStatus);
    if (updated) {
      setToastMessage(`訂單 ${orderId} 狀態已更新為「${newStatus}」！`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Reset sample data with in-app confirm
  const handleConfirmResetSampleData = () => {
    proxyStore.resetToSampleData();
    setOrders(proxyStore.getOrders());
    setCategories(proxyStore.getCategories());
    setProducts(proxyStore.getProducts());
    setIsResetConfirmOpen(false);
    setToastMessage('已成功重設為西山居預設範例資料！');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Save rate config
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRateConfig({
      exchangeRate: parseFloat(exchangeRateInput) || 4.65,
      serviceFeePercent: parseFloat(serviceFeeInput) || 3,
      twDomesticShipping711: parseFloat(shipping711Input) || 60,
    });
    setIsRateSettingsOpen(false);
    setToastMessage('匯率與服務費率設定已儲存！');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#223147] text-[#E2B755] font-bold px-4 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2 border border-[#C5922E]">
          <CheckCircle2 className="w-5 h-5 text-[#C5922E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#DDD5C7] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#223147] text-[#E2B755] border border-[#C5922E]/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5922E]" />
              <span>管理員專屬後台</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
              syncStatus.isConnected
                ? 'bg-[#EBF7F0] text-[#2E8B57] border-[#A3D9B8]'
                : syncStatus.error
                ? 'bg-[#FFF2F0] text-[#CF1322] border-[#FFCCC7]'
                : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                syncStatus.isConnected ? 'bg-[#2E8B57] animate-pulse' : 'bg-[#CF1322]'
              }`} />
              <span>{syncStatus.isConnected ? 'Firebase 雲端即時同步中' : syncStatus.error ? '雲端同步異常' : '連線中...'}</span>
              {syncStatus.lastSyncTime && (
                <span className="text-[10px] opacity-75 font-normal ml-0.5">({syncStatus.lastSyncTime})</span>
              )}
            </span>
            {adminUser?.isDevBypass && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF7F2] text-[#6B7280] border border-[#DDD5C7]">
                免密模式
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E2530]">
            代購管理中心
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            歡迎，<strong className="text-[#1E2530]">{adminUser?.displayName || '代購掌門人'}</strong>！您可在此管理店鋪分類、商品規格、編輯訂單進度與檢視財務報表。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={handleManualSync}
            disabled={isSyncingCloud}
            className="px-3.5 py-2 rounded-xl bg-[#223147] hover:bg-[#1A2637] text-[#E2B755] text-xs font-bold border border-[#C5922E]/50 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="將目前所有商品、分類與訂單強制備份寫入 Firebase Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
            <span>{isSyncingCloud ? '雲端同步中...' : '一鍵同步到 Firebase'}</span>
          </button>

          <button
            onClick={() => setIsRateSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#223147] text-xs font-semibold border border-[#DDD5C7] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="設定匯率與費率"
          >
            <Settings className="w-3.5 h-3.5 text-[#C5922E]" />
            <span>匯率參數</span>
          </button>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#6B7280] text-xs font-semibold border border-[#DDD5C7] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="重設預設資料"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重設範例</span>
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#A63434] border border-[#E8C4C4] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出後台</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-1 shadow-xs">
          <div className="text-xs text-[#6B7280] font-medium">總訂單量</div>
          <div className="text-2xl font-extrabold text-[#1E2530]">{stats.total} <span className="text-xs text-[#8A95A5] font-normal">筆</span></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-1 shadow-xs">
          <div className="text-xs text-[#A63434] font-medium">待付訂金</div>
          <div className="text-2xl font-extrabold text-[#A63434]">{stats.pendingPayment} <span className="text-xs text-[#A63434]/70 font-normal">筆</span></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-1 shadow-xs">
          <div className="text-xs text-[#B86200] font-medium">已收款項</div>
          <div className="text-2xl font-extrabold text-[#B86200]">{stats.paymentReceived} <span className="text-xs text-[#B86200]/70 font-normal">筆</span></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-1 shadow-xs">
          <div className="text-xs text-[#C5922E] font-medium">採購與轉運中</div>
          <div className="text-2xl font-extrabold text-[#C5922E]">{stats.inTransit} <span className="text-xs text-[#C5922E]/70 font-normal">筆</span></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-1 shadow-xs">
          <div className="text-xs text-[#2E8B57] font-medium">已寄出 / 完成</div>
          <div className="text-2xl font-extrabold text-[#2E8B57]">{stats.shipped} <span className="text-xs text-[#2E8B57]/70 font-normal">筆</span></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DDD5C7] space-y-1 shadow-xs">
          <div className="text-xs text-[#4A5568] font-medium">代購流水 (TWD)</div>
          <div className="text-lg font-extrabold text-[#1E2530] truncate">NT$ {stats.totalTwd}</div>
        </div>
      </div>

      {/* Admin 4 Primary Navigation Buttons: 店鋪管理, 商品管理, 訂單管理, 財務報表 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 bg-white rounded-2xl border border-[#DDD5C7] shadow-xs">
        <button
          id="admin-tab-shops"
          onClick={() => setActiveTab('shops')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'shops'
              ? 'bg-[#223147] text-[#E2B755] border border-[#C5922E]/50 shadow-xs'
              : 'text-[#4A5568] hover:bg-[#FAF7F2] hover:text-[#1E2530]'
          }`}
        >
          <Store className="w-4 h-4 text-[#C5922E]" />
          <span>店鋪與種類管理</span>
          <span className="text-[11px] opacity-80">({categories.length})</span>
        </button>

        <button
          id="admin-tab-catalog"
          onClick={() => setActiveTab('catalog')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-[#223147] text-[#E2B755] border border-[#C5922E]/50 shadow-xs'
              : 'text-[#4A5568] hover:bg-[#FAF7F2] hover:text-[#1E2530]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#C5922E]" />
          <span>商品與規格管理</span>
          <span className="text-[11px] opacity-80">({products.length})</span>
        </button>

        <button
          id="admin-tab-orders"
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#223147] text-[#E2B755] border border-[#C5922E]/50 shadow-xs'
              : 'text-[#4A5568] hover:bg-[#FAF7F2] hover:text-[#1E2530]'
          }`}
        >
          <Package className="w-4 h-4 text-[#C5922E]" />
          <span>訂單進度管理</span>
          <span className="text-[11px] opacity-80">({orders.length})</span>
        </button>

        <button
          id="admin-tab-finance"
          onClick={() => setActiveTab('finance')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'finance'
              ? 'bg-[#223147] text-[#E2B755] border border-[#C5922E]/50 shadow-xs'
              : 'text-[#4A5568] hover:bg-[#FAF7F2] hover:text-[#1E2530]'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#C5922E]" />
          <span>財務報表</span>
        </button>
      </div>

      {/* TAB 1 & TAB 2: 店鋪管理 & 商品管理 (Catalog Manager) */}
      {(activeTab === 'shops' || activeTab === 'catalog') && (
        <CatalogManager
          categories={categories}
          products={products}
          defaultTab={activeTab === 'shops' ? 'shops' : 'products'}
          onSaveProduct={(p) => {
            proxyStore.saveProduct(p);
            setProducts(proxyStore.getProducts());
          }}
          onDeleteProduct={(id) => {
            proxyStore.deleteProduct(id);
            setProducts(proxyStore.getProducts());
          }}
          onSaveCategory={(c) => {
            proxyStore.saveCategory(c);
            setCategories(proxyStore.getCategories());
          }}
          onDeleteCategory={(id) => {
            proxyStore.deleteCategory(id);
            setCategories(proxyStore.getCategories());
            setProducts(proxyStore.getProducts());
          }}
        />
      )}

      {/* TAB 2: 訂單管理 (Order Management) */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            {/* Status Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: '全部訂單' },
                { id: 'pending_payment', label: '待付款' },
                { id: 'payment_received', label: '已收款' },
                { id: 'procuring', label: '採購中' },
                { id: 'warehouse_in', label: '集運倉' },
                { id: 'shipping_intl', label: '國際空運' },
                { id: 'arrived_tw', label: '已抵台' },
                { id: 'shipped', label: '已寄出' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer border ${
                    statusFilter === filter.id
                      ? 'bg-[#223147] text-[#E2B755] border-[#C5922E] shadow-xs'
                      : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[280px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A95A5]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋買家暱稱、訂單號、品項..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#DDD5C7] focus:border-[#C5922E] text-[#1E2530] placeholder-[#8A95A5] text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-[#DDD5C7] text-[#6B7280] space-y-2 shadow-xs">
              <AlertCircle className="w-8 h-8 mx-auto text-[#C5922E]" />
              <p className="text-sm font-bold text-[#1E2530]">查無符合條件的訂單</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => {
                return (
                  <div
                    key={ord.id}
                    id={`admin-order-card-${ord.id}`}
                    className="p-5 rounded-2xl bg-white border border-[#DDD5C7] hover:border-[#C5922E]/60 transition-all space-y-4 shadow-xs"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DDD5C7]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-[#C5922E]">
                          {ord.id}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          買家：<strong className="text-[#1E2530]">{ord.buyerNickname}</strong>
                        </span>
                        <span className="text-[11px] text-[#4A5568] bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-[#DDD5C7]">
                          {ord.contactMethod.toUpperCase()}: {ord.contactValue}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Current Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ord.status === 'pending_payment'
                            ? 'bg-[#FFF5F5] text-[#A63434] border border-[#E8C4C4]'
                            : ord.status === 'payment_received'
                            ? 'bg-[#FEF3D6] text-[#B26A00] border border-[#B26A00]/20'
                            : ord.status === 'shipped' || ord.status === 'completed'
                            ? 'bg-[#E8F8F0] text-[#2E8B57] border border-[#2E8B57]/20'
                            : 'bg-[#FAF7F2] text-[#223147] border border-[#DDD5C7]'
                        }`}>
                          {ord.status === 'pending_payment' && '待付款 (未收訂金)'}
                          {ord.status === 'payment_received' && '已收款 (已收訂金)'}
                          {ord.status === 'procuring' && '官方採購中'}
                          {ord.status === 'warehouse_in' && '抵達大陸集運'}
                          {ord.status === 'shipping_intl' && '國際轉運中'}
                          {ord.status === 'arrived_tw' && '已抵台分檢'}
                          {ord.status === 'shipped' && '已寄出 (附單號)'}
                          {ord.status === 'completed' && '交易完成'}
                          {ord.status === 'cancelled' && '已取消'}
                        </span>

                        {/* Open Detailed Edit Modal */}
                        <button
                          id={`btn-open-edit-order-${ord.id}`}
                          onClick={() => setSelectedEditingOrder(ord)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] border border-[#C5922E]/50 font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#C5922E]" />
                          <span>詳細編輯 / 查看說明圖</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle: Items and Specs Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      <div className="lg:col-span-8 space-y-2">
                        {ord.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs">
                            <img
                              src={item.coverImage}
                              alt={item.productName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-[#DDD5C7] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-[#1E2530] truncate block">
                                {item.productName}
                              </span>
                              <span className="text-[#4A5568] text-[11px]">
                                {item.selectedSpecsText} (x{item.quantity})
                              </span>
                            </div>
                            <div className="text-right shrink-0 text-[#1E2530] font-bold">
                              NT$ {item.priceTwd * item.quantity}
                            </div>
                          </div>
                        ))}

                        {/* Public Notes Snippet */}
                        {ord.publicNotes && (
                          <div className="mt-2 text-xs text-[#4A5568] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#DDD5C7] flex items-start gap-2">
                            <span className="text-[#1E2530] font-bold shrink-0">公開備註:</span>
                            <span className="line-clamp-2">{ord.publicNotes}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Payment & Delivery Summary */}
                      <div className="lg:col-span-4 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">總金額:</span>
                          <span className="font-bold text-[#1E2530]">NT$ {ord.totalTwd}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">已付訂金:</span>
                          <span className="font-bold text-[#2E8B57]">NT$ {ord.depositTwd}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">待付尾款+運費:</span>
                          <span className="font-bold text-[#A63434]">NT$ {ord.remainingTwd}</span>
                        </div>
                        {ord.paymentAccountLast5 && (
                          <div className="flex justify-between text-[#C5922E]">
                            <span>買家末五碼:</span>
                            <span className="font-mono font-bold">{ord.paymentAccountLast5}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Quick Status Changer Buttons */}
                    <div className="pt-2 border-t border-[#DDD5C7] flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[#6B7280] font-bold text-[11px] mr-1">快捷切換狀態：</span>
                      <button
                        onClick={() => handleQuickStatusChange(ord.id, 'pending_payment')}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                          ord.status === 'pending_payment'
                            ? 'bg-[#A63434] text-white border-[#A63434]'
                            : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        待付款
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(ord.id, 'payment_received')}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                          ord.status === 'payment_received'
                            ? 'bg-[#B26A00] text-white border-[#B26A00]'
                            : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        已收款
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(ord.id, 'procuring')}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                          ord.status === 'procuring'
                            ? 'bg-[#C5922E] text-white border-[#C5922E]'
                            : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        採購中
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(ord.id, 'warehouse_in')}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                          ord.status === 'warehouse_in'
                            ? 'bg-[#6B46C1] text-white border-[#6B46C1]'
                            : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        抵達集運
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(ord.id, 'arrived_tw')}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                          ord.status === 'arrived_tw'
                            ? 'bg-[#2E8B57] text-white border-[#2E8B57]'
                            : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        已抵台
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(ord.id, 'shipped')}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                          ord.status === 'shipped'
                            ? 'bg-[#1E2530] text-white border-[#1E2530]'
                            : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        已寄出
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 財務報表 (Financial Report) */}
      {activeTab === 'finance' && (
        <FinancialReport 
          orders={orders} 
          onBack={() => setActiveTab('shops')} 
        />
      )}

      {/* Rate Settings Modal */}
      {isRateSettingsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsRateSettingsOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white p-6 sm:p-7 rounded-2xl border border-[#DDD5C7] space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-extrabold text-[#1E2530] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#C5922E]" />
                <span>匯率與代購規則設定</span>
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                設定系統預設的人民幣換算台幣基準匯率與代購手續費率。
              </p>
            </div>

            <form onSubmit={handleSaveRates} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">基準匯率 (1 RMB = ? TWD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={exchangeRateInput}
                  onChange={(e) => setExchangeRateInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-mono outline-none focus:border-[#C5922E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">代購服務費率 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={serviceFeeInput}
                  onChange={(e) => setServiceFeeInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-mono outline-none focus:border-[#C5922E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">台灣超商店到店預設運費 (TWD)</label>
                <input
                  type="number"
                  required
                  value={shipping711Input}
                  onChange={(e) => setShipping711Input(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-mono outline-none focus:border-[#C5922E]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRateSettingsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#4A5568] font-bold text-xs cursor-pointer border border-[#DDD5C7]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] border border-[#C5922E]/40 font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  儲存設定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detailed Edit Modal */}
      {selectedEditingOrder && (
        <OrderEditModal
          order={selectedEditingOrder}
          onClose={() => setSelectedEditingOrder(null)}
          onOrderUpdated={(updated) => {
            setSelectedEditingOrder(null);
            setOrders(proxyStore.getOrders());
          }}
        />
      )}
      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white border border-[#DDD5C7] rounded-2xl p-6 shadow-2xl text-[#1E2530] space-y-4">
            <div className="flex items-center gap-3 text-[#A63434]">
              <div className="w-10 h-10 rounded-full bg-[#FFF5F5] border border-[#E8C4C4] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-[#A63434]" />
              </div>
              <h4 className="font-extrabold text-base text-[#1E2530]">重設為預設範例資料？</h4>
            </div>

            <p className="text-xs text-[#4A5568] leading-relaxed">
              此操作將重設店鋪、商品規格與測試訂單為預設範例。您自訂新增的資料將被覆蓋。
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#4A5568] font-bold text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmResetSampleData}
                className="px-4 py-2 rounded-xl bg-[#A63434] hover:bg-[#8F2828] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                確認重設
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

