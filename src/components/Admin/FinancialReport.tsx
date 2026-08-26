import React, { useState, useMemo } from 'react';
import { Order, FinancialTransaction, TransactionType } from '../../types';
import { proxyStore } from '../../services/store';
import { 
  Plus, Settings, ArrowLeft, Search, Filter, Download, 
  Trash2, Edit3, CheckCircle2, DollarSign, TrendingUp, TrendingDown,
  Calendar, RefreshCw, Layers, FileSpreadsheet, Eye, CreditCard, Tag, ArrowUpRight, ArrowDownRight, X
} from 'lucide-react';

interface FinancialReportProps {
  orders: Order[];
  onBack?: () => void;
}

export const FinancialReport: React.FC<FinancialReportProps> = ({ orders, onBack }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(proxyStore.getTransactions());
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<'all' | 'revenue' | 'expense'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'this_month' | 'last_30_days'>('all');

  // Modals state
  const [isAddRevenueModalOpen, setIsAddRevenueModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);

  // Form states for adding revenue
  const [revenueForm, setRevenueForm] = useState({
    title: '',
    amountTwd: '',
    channelOrCategory: '手動',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    buyerOrPayee: '',
    orderId: '',
    paymentMethod: '銀行轉帳',
    note: '',
  });

  // Form states for adding expense
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amountTwd: '',
    amountRmb: '',
    channelOrCategory: '採購成本',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    buyerOrPayee: '',
    paymentMethod: '支付寶',
    note: '',
  });

  // Listen to store updates
  React.useEffect(() => {
    const unsubscribe = proxyStore.subscribe(() => {
      setTransactions(proxyStore.getTransactions());
    });
    return () => unsubscribe();
  }, []);

  // Compute 3 Key Summary KPI Metrics
  const summaryMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalExpense = 0;

    // Channel-based breakdown
    let ditanRevenue = 0; // 地攤
    let xiaobingRevenue = 0; // 小餅
    let manualRevenue = 0; // 手動
    const otherChannels: Record<string, number> = {};

    transactions.forEach((txn) => {
      if (txn.type === 'revenue') {
        totalRevenue += txn.amountTwd;
        const channel = txn.channelOrCategory;
        if (channel === '地攤') {
          ditanRevenue += txn.amountTwd;
        } else if (channel === '小餅') {
          xiaobingRevenue += txn.amountTwd;
        } else if (channel === '手動') {
          manualRevenue += txn.amountTwd;
        } else {
          otherChannels[channel] = (otherChannels[channel] || 0) + txn.amountTwd;
        }
      } else if (txn.type === 'expense') {
        totalExpense += txn.amountTwd;
      }
    });

    const netProfit = totalRevenue - totalExpense;

    return {
      totalRevenue,
      totalExpense,
      netProfit,
      ditanRevenue,
      xiaobingRevenue,
      manualRevenue,
      otherChannels,
    };
  }, [transactions]);

  // Filtered transactions for the ledger (流水)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // Type filter
      if (typeFilter !== 'all' && txn.type !== typeFilter) {
        return false;
      }

      // Channel / Category filter
      if (channelFilter !== 'all' && txn.channelOrCategory !== channelFilter) {
        return false;
      }

      // Time filter
      if (timeFilter === 'this_month') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (!txn.date.startsWith(currentMonth)) return false;
      } else if (timeFilter === 'last_30_days') {
        const now = Date.now();
        const txnTime = new Date(txn.date).getTime();
        if (isNaN(txnTime) || now - txnTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const match =
          txn.title.toLowerCase().includes(q) ||
          txn.channelOrCategory.toLowerCase().includes(q) ||
          (txn.buyerOrPayee && txn.buyerOrPayee.toLowerCase().includes(q)) ||
          (txn.orderId && txn.orderId.toLowerCase().includes(q)) ||
          (txn.note && txn.note.toLowerCase().includes(q)) ||
          (txn.paymentMethod && txn.paymentMethod.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, channelFilter, timeFilter, searchQuery]);

  // Handle Add Revenue Submit
  const handleAddRevenueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(revenueForm.amountTwd);
    if (isNaN(amount) || amount < 0) return;

    proxyStore.addTransaction({
      type: 'revenue',
      title: revenueForm.title.trim() || `${revenueForm.channelOrCategory}營收入帳`,
      amountTwd: Math.round(amount),
      channelOrCategory: revenueForm.channelOrCategory,
      date: revenueForm.date,
      time: revenueForm.time,
      buyerOrPayee: revenueForm.buyerOrPayee.trim() || undefined,
      orderId: revenueForm.orderId.trim() || undefined,
      paymentMethod: revenueForm.paymentMethod,
      note: revenueForm.note.trim() || undefined,
    });

    setIsAddRevenueModalOpen(false);
    setRevenueForm({
      title: '',
      amountTwd: '',
      channelOrCategory: '手動',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      buyerOrPayee: '',
      orderId: '',
      paymentMethod: '銀行轉帳',
      note: '',
    });
  };

  // Handle Add Expense Submit
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amountTwd);
    if (isNaN(amount) || amount < 0) return;

    proxyStore.addTransaction({
      type: 'expense',
      title: expenseForm.title.trim() || `${expenseForm.channelOrCategory}支出`,
      amountTwd: Math.round(amount),
      amountRmb: expenseForm.amountRmb ? parseFloat(expenseForm.amountRmb) : undefined,
      channelOrCategory: expenseForm.channelOrCategory,
      date: expenseForm.date,
      time: expenseForm.time,
      buyerOrPayee: expenseForm.buyerOrPayee.trim() || undefined,
      paymentMethod: expenseForm.paymentMethod,
      note: expenseForm.note.trim() || undefined,
    });

    setIsAddExpenseModalOpen(false);
    setExpenseForm({
      title: '',
      amountTwd: '',
      amountRmb: '',
      channelOrCategory: '採購成本',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      buyerOrPayee: '',
      paymentMethod: '支付寶',
      note: '',
    });
  };

  // Handle Delete
  const handleDeleteTransaction = (id: string) => {
    proxyStore.deleteTransaction(id);
    setDeletingTxnId(null);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['流水單號', '收支類型', '渠道/類別', '項目名稱', '收支金額(TWD)', '原幣(RMB)', '買家/經手人', '關聯訂單', '支付方式', '交易日期', '備註說明'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.type === 'revenue' ? '營收' : '支出',
      `"${t.channelOrCategory}"`,
      `"${t.title}"`,
      t.amountTwd,
      t.amountRmb || '',
      `"${t.buyerOrPayee || ''}"`,
      `"${t.orderId || ''}"`,
      `"${t.paymentMethod || ''}"`,
      `"${t.date} ${t.time || ''}"`,
      `"${t.note || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `西山居代購_財務收支流水帳_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Available channel/category options for filter dropdown
  const allChannelsAndCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.channelOrCategory));
    return Array.from(set);
  }, [transactions]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & ACTION BUTTONS (Exact match to screenshot) */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Back Link + Big Title */}
        <div>
          {onBack ? (
            <button
              onClick={onBack}
              className="text-xs sm:text-sm font-bold text-[#4A5568] hover:text-[#1E2530] flex items-center gap-1.5 transition-colors cursor-pointer mb-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回管理選單</span>
            </button>
          ) : (
            <div className="text-xs font-bold text-[#6B7280] mb-1 flex items-center gap-1.5">
              <span>← 返回管理選單</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2530] tracking-tight">
            財務報表
          </h1>
        </div>

        {/* Right: Settings Icon, Green + 手動新增營收, Red + 記一筆支出 */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Settings Icon Button */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#3D4756] hover:bg-[#2C3542] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer border border-[#4A5568]/40"
            title="財務設定與工具"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>

          {/* Green Button: + 手動新增營收 */}
          <button
            id="btn-add-manual-revenue"
            onClick={() => setIsAddRevenueModalOpen(true)}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 text-white font-black" />
            <span>手動新增營收</span>
          </button>

          {/* Red Button: + 記一筆支出 */}
          <button
            id="btn-add-expense"
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 text-white font-black" />
            <span>記一筆支出</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. THREE SUMMARY KPI CARDS (Exact layout from user screenshot) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* CARD 1: 總營收 (REVENUE) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E2DCD5] shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#4A5568] tracking-wider uppercase">
            總營收 (REVENUE)
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#15803D] tracking-tight">
            ${summaryMetrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs sm:text-[13px] text-[#6B7280] font-medium pt-1 truncate">
            地攤: ${summaryMetrics.ditanRevenue.toLocaleString()} ｜ 小餅: ${summaryMetrics.xiaobingRevenue.toLocaleString()} ｜ 手動: ${summaryMetrics.manualRevenue.toLocaleString()}
          </div>
        </div>

        {/* CARD 2: 總支出 (EXPENSES) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E2DCD5] shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#4A5568] tracking-wider uppercase">
            總支出 (EXPENSES)
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#DC2626] tracking-tight">
            ${summaryMetrics.totalExpense.toLocaleString()}
          </div>
          <div className="text-xs sm:text-[13px] text-[#6B7280] font-medium pt-1">
            含製作費、運費等成本
          </div>
        </div>

        {/* CARD 3: 淨利 (NET PROFIT) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E2DCD5] shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#4A5568] tracking-wider uppercase">
            淨利 (NET PROFIT)
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#1E2530] tracking-tight">
            ${summaryMetrics.netProfit.toLocaleString()}
          </div>
          <div className="text-xs sm:text-[13px] text-[#6B7280] font-medium pt-1">
            總營收 - 總支出
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. CASH FLOW LEDGER / TRANSACTIONS (下面是流水) */}
      {/* ========================================================= */}
      <div className="space-y-4">
        {/* Ledger Header & Filters */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDD5C7] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DDD5C7]">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#1E2530] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#C5922E]" />
                <span>收支明細流水帳</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF7F2] text-[#6B7280] border border-[#DDD5C7]">
                共 {filteredTransactions.length} 筆明細
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Switcher Pills */}
              <div className="flex items-center bg-[#FAF7F2] p-1 rounded-xl border border-[#DDD5C7] text-xs font-bold">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    typeFilter === 'all'
                      ? 'bg-[#223147] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#1E2530]'
                  }`}
                >
                  全部收支
                </button>
                <button
                  onClick={() => setTypeFilter('revenue')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'revenue'
                      ? 'bg-[#15803D] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#15803D]'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  僅看營收
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'expense'
                      ? 'bg-[#DC2626] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#DC2626]'
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  僅看支出
                </button>
              </div>

              {/* Export CSV button */}
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#223147] border border-[#DDD5C7] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="匯出收支流水 CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#C5922E]" />
                <span>匯出流水</span>
              </button>
            </div>
          </div>

          {/* Search & Sub-filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A95A5]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋項目、買家、訂單號或備註..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] placeholder-[#8A95A5] text-xs outline-none focus:border-[#C5922E]"
              />
            </div>

            {/* Channel / Category dropdown */}
            <div className="relative">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] text-xs outline-none focus:border-[#C5922E] cursor-pointer"
              >
                <option value="all">全部渠道 / 分類</option>
                <optgroup label="營收渠道">
                  <option value="地攤">地攤 (XSJ代購)</option>
                  <option value="小餅">小餅 (官方旗艦店)</option>
                  <option value="手動">手動新增</option>
                </optgroup>
                <optgroup label="支出分類">
                  <option value="採購成本">採購成本 (淘寶原幣)</option>
                  <option value="國際運費">國際運費 / 空運</option>
                  <option value="包材費用">包材與紙箱費用</option>
                  <option value="國內運費">台灣店到店運費</option>
                  <option value="雜支">店鋪雜支 / 其他</option>
                </optgroup>
              </select>
            </div>

            {/* Time Filter */}
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] text-xs outline-none focus:border-[#C5922E] cursor-pointer"
              >
                <option value="all">全部日期紀錄</option>
                <option value="this_month">本月收支明細</option>
                <option value="last_30_days">最近 30 天</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table / List */}
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#DDD5C7] space-y-3 shadow-xs">
            <DollarSign className="w-10 h-10 mx-auto text-[#8A95A5]" />
            <h3 className="text-sm sm:text-base font-bold text-[#1E2530]">目前無符合篩選條件的收支流水</h3>
            <p className="text-xs text-[#6B7280]">
              您可以點擊上方按鈕【手動新增營收】或【記一筆支出】來開始記錄您的第一筆帳目！
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsAddRevenueModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#15803D] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                新增營收
              </button>
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#DC2626] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                記一筆支出
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-[#DDD5C7] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#DDD5C7] text-[#6B7280] font-bold">
                  <tr>
                    <th className="py-3 px-4">日期 / 時間</th>
                    <th className="py-3 px-3">類型</th>
                    <th className="py-3 px-3">渠道 / 分類</th>
                    <th className="py-3 px-4">項目名稱與說明</th>
                    <th className="py-3 px-3">買家 / 經手人</th>
                    <th className="py-3 px-3">支付方式</th>
                    <th className="py-3 px-4 text-right">收支金額 (TWD)</th>
                    <th className="py-3 px-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C7]">
                  {filteredTransactions.map((txn) => {
                    const isRev = txn.type === 'revenue';
                    return (
                      <tr key={txn.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        {/* Date & Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[#1E2530]">{txn.date}</div>
                          {txn.time && <div className="text-[11px] text-[#8A95A5]">{txn.time}</div>}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs ${
                              isRev
                                ? 'bg-[#E8F8F0] text-[#15803D] border border-[#A7F3D0]'
                                : 'bg-[#FFF1F2] text-[#DC2626] border border-[#FECDD3]'
                            }`}
                          >
                            {isRev ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isRev ? '營收' : '支出'}
                          </span>
                        </td>

                        {/* Channel / Category */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                              txn.channelOrCategory === '地攤'
                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                : txn.channelOrCategory === '小餅'
                                ? 'bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE]'
                                : txn.channelOrCategory === '手動'
                                ? 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]'
                                : 'bg-[#FAF7F2] text-[#4A5568] border border-[#DDD5C7]'
                            }`}
                          >
                            {txn.channelOrCategory}
                          </span>
                        </td>

                        {/* Title & Notes / Order ID */}
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="font-bold text-[#1E2530]">{txn.title}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {txn.orderId && (
                              <span className="text-[10px] font-mono font-bold text-[#C5922E] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                                訂單: {txn.orderId}
                              </span>
                            )}
                            {txn.note && (
                              <span className="text-[11px] text-[#6B7280] truncate max-w-xs">
                                {txn.note}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Buyer / Payee */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#4A5568]">
                          {txn.buyerOrPayee || '—'}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#4A5568]">
                          {txn.paymentMethod ? (
                            <span className="bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#DDD5C7] text-[11px]">
                              {txn.paymentMethod}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div
                            className={`font-black text-sm sm:text-base ${
                              isRev ? 'text-[#15803D]' : 'text-[#DC2626]'
                            }`}
                          >
                            {isRev ? '+' : '-'}${txn.amountTwd.toLocaleString()}
                          </div>
                          {txn.amountRmb && (
                            <div className="text-[10px] text-[#8A95A5]">
                              (¥ {txn.amountRmb})
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingTransaction(txn)}
                              className="p-1.5 rounded-lg text-[#4A5568] hover:bg-[#FAF7F2] hover:text-[#1E2530] transition-colors cursor-pointer"
                              title="編輯流水紀錄"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingTxnId(txn.id)}
                              className="p-1.5 rounded-lg text-[#A63434] hover:bg-[#FFF5F5] transition-colors cursor-pointer"
                              title="刪除流水紀錄"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Stats */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#DDD5C7] flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-bold text-[#4A5568]">
              <div>
                顯示中流水：{filteredTransactions.length} 筆
              </div>
              <div className="flex items-center gap-4">
                <div>
                  當前頁面營收小計: <span className="text-[#15803D] font-black">+${filteredTransactions.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amountTwd, 0).toLocaleString()}</span>
                </div>
                <div>
                  當前頁面支出小計: <span className="text-[#DC2626] font-black">-${filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountTwd, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: 手動新增營收 (Add Revenue Modal) */}
      {/* ========================================================= */}
      {isAddRevenueModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsAddRevenueModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white p-6 sm:p-7 rounded-2xl border border-[#DDD5C7] space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <h3 className="text-lg font-extrabold text-[#15803D] flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>手動新增營收入帳</span>
              </h3>
              <button
                onClick={() => setIsAddRevenueModalOpen(false)}
                className="p-1 rounded-lg text-[#6B7280] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRevenueSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">營收金額 (TWD) <span className="text-[#DC2626]">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="例如: 1500"
                    value={revenueForm.amountTwd}
                    onChange={(e) => setRevenueForm({ ...revenueForm, amountTwd: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-black text-base outline-none focus:border-[#15803D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">營收渠道 / 標籤</label>
                  <select
                    value={revenueForm.channelOrCategory}
                    onChange={(e) => setRevenueForm({ ...revenueForm, channelOrCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-bold outline-none focus:border-[#15803D]"
                  >
                    <option value="手動">手動新增</option>
                    <option value="地攤">地攤 (XSJ代購)</option>
                    <option value="小餅">小餅 (官方旗艦店)</option>
                    <option value="社群委託">社群加單 / 特殊代購</option>
                    <option value="展會現場">展會現場面交</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">項目名稱 / 描述 <span className="text-[#DC2626]">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="例如: 西山居貼紙追加單、面交尾款等"
                  value={revenueForm.title}
                  onChange={(e) => setRevenueForm({ ...revenueForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">買家暱稱 / 委託人</label>
                  <input
                    type="text"
                    placeholder="例如: 太虛純陽一隻羊"
                    value={revenueForm.buyerOrPayee}
                    onChange={(e) => setRevenueForm({ ...revenueForm, buyerOrPayee: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#15803D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">付款方式</label>
                  <select
                    value={revenueForm.paymentMethod}
                    onChange={(e) => setRevenueForm({ ...revenueForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#15803D]"
                  >
                    <option value="銀行轉帳">銀行轉帳</option>
                    <option value="LINE Pay">LINE Pay</option>
                    <option value="現金">現金 / 面交</option>
                    <option value="超商代碼">超商代碼</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">入帳日期</label>
                  <input
                    type="date"
                    required
                    value={revenueForm.date}
                    onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#15803D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">關聯訂單編號 (選填)</label>
                  <input
                    type="text"
                    placeholder="例如: XSJ-202608-0101"
                    value={revenueForm.orderId}
                    onChange={(e) => setRevenueForm({ ...revenueForm, orderId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">備註說明 (選填)</label>
                <textarea
                  rows={2}
                  placeholder="備註這筆營收的細節、優惠或特殊說明..."
                  value={revenueForm.note}
                  onChange={(e) => setRevenueForm({ ...revenueForm, note: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRevenueModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#4A5568] font-bold text-xs cursor-pointer border border-[#DDD5C7]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  確認新增營收
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: 記一筆支出 (Add Expense Modal) */}
      {/* ========================================================= */}
      {isAddExpenseModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsAddExpenseModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white p-6 sm:p-7 rounded-2xl border border-[#DDD5C7] space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <h3 className="text-lg font-extrabold text-[#DC2626] flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>記一筆支出成本</span>
              </h3>
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-1 rounded-lg text-[#6B7280] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">支出金額 (TWD) <span className="text-[#DC2626]">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="例如: 850"
                    value={expenseForm.amountTwd}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amountTwd: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-black text-base outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">支出類別</label>
                  <select
                    value={expenseForm.channelOrCategory}
                    onChange={(e) => setExpenseForm({ ...expenseForm, channelOrCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-bold outline-none focus:border-[#DC2626]"
                  >
                    <option value="採購成本">官方採購成本 (淘寶等)</option>
                    <option value="國際運費">國際轉運運費 (空運/海快)</option>
                    <option value="包材費用">包材、氣泡紙、紙箱</option>
                    <option value="國內運費">台灣店到店/宅配運費</option>
                    <option value="雜支">雜支 / 匯差 / 手續費</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">項目名稱 / 用途說明 <span className="text-[#DC2626]">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="例如: 官方旗艦店第一批次採購款、順豐空運費等"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">原幣金額 (RMB, 選填)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="例如: 180"
                    value={expenseForm.amountRmb}
                    onChange={(e) => {
                      const rmb = parseFloat(e.target.value);
                      setExpenseForm({
                        ...expenseForm,
                        amountRmb: e.target.value,
                        amountTwd: !isNaN(rmb) ? Math.round(rmb * 4.65).toString() : expenseForm.amountTwd,
                      });
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">支付方式</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#DC2626]"
                  >
                    <option value="支付寶">支付寶 (Alipay)</option>
                    <option value="微信支付">微信支付 (WeChat)</option>
                    <option value="信用卡">信用卡</option>
                    <option value="銀行轉帳">銀行轉帳</option>
                    <option value="現金">現金</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">支出日期</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">經手人 / 付款對象</label>
                  <input
                    type="text"
                    placeholder="例如: 西山居旗艦店 / 集運商"
                    value={expenseForm.buyerOrPayee}
                    onChange={(e) => setExpenseForm({ ...expenseForm, buyerOrPayee: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">備註說明 (選填)</label>
                <textarea
                  rows={2}
                  placeholder="備註支出憑證、單號或明細..."
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#4A5568] font-bold text-xs cursor-pointer border border-[#DDD5C7]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  確認記錄支出
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: 編輯單筆流水 (Edit Transaction Modal) */}
      {/* ========================================================= */}
      {editingTransaction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setEditingTransaction(null)}
        >
          <div 
            className="w-full max-w-lg bg-white p-6 sm:p-7 rounded-2xl border border-[#DDD5C7] space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <h3 className="text-base font-extrabold text-[#1E2530]">
                編輯流水紀錄 ({editingTransaction.id})
              </h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">收支類型</label>
                  <select
                    value={editingTransaction.type}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value as TransactionType })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-bold outline-none"
                  >
                    <option value="revenue">營收 (Revenue)</option>
                    <option value="expense">支出 (Expense)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">金額 (TWD)</label>
                  <input
                    type="number"
                    value={editingTransaction.amountTwd}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amountTwd: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] font-black outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">項目名稱</label>
                <input
                  type="text"
                  value={editingTransaction.title}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">渠道 / 分類</label>
                  <input
                    type="text"
                    value={editingTransaction.channelOrCategory}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, channelOrCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">日期</label>
                  <input
                    type="date"
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">備註說明</label>
                <textarea
                  rows={2}
                  value={editingTransaction.note || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, note: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#4A5568] font-bold text-xs cursor-pointer border border-[#DDD5C7]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    proxyStore.updateTransaction(editingTransaction.id, editingTransaction);
                    setEditingTransaction(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] font-bold text-xs shadow-xs cursor-pointer"
                >
                  儲存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: 刪除確認 (Delete Confirm) */}
      {/* ========================================================= */}
      {deletingTxnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-[#DDD5C7] space-y-4 shadow-2xl text-[#1E2530]">
            <h4 className="font-extrabold text-base text-[#DC2626] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>確認刪除此筆流水紀錄？</span>
            </h4>
            <p className="text-xs text-[#6B7280]">
              此操作將從財務報表流水帳中移除該筆紀錄，無法復原。
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTxnId(null)}
                className="flex-1 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#4A5568] font-bold text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTransaction(deletingTxnId)}
                className="flex-1 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: 財務設定 (Settings Modal) */}
      {/* ========================================================= */}
      {isSettingsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white p-6 sm:p-7 rounded-2xl border border-[#DDD5C7] space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
              <h3 className="text-base font-extrabold text-[#1E2530] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#3D4756]" />
                <span>財務報表與流水設定</span>
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-[#6B7280] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] space-y-2">
                <span className="font-bold text-[#1E2530] block">⚡ 快速批次功能</span>
                <p className="text-[#6B7280]">
                  您可以一鍵匯出完整的財務收支流水帳 CSV，或依需求重設預設示範流水。
                </p>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full py-2 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>匯出完整 CSV 報表</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8C4C4] space-y-2">
                <span className="font-bold text-[#A63434] block">🔄 重設示範流水資料</span>
                <p className="text-[#A63434]/80">
                  將流水帳恢復至預設的「地攤: $46,248 ｜ 小餅: $16,424 ｜ 手動: $0」範例帳目。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    proxyStore.resetToSampleData();
                    setIsSettingsModalOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-[#A63434] hover:bg-[#8F2828] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>重設為示範帳目</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-[#4A5568] font-bold text-xs cursor-pointer border border-[#DDD5C7]"
              >
                關閉設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
