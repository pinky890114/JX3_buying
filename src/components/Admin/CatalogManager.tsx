import React, { useState, useMemo, useEffect } from 'react';
import { Category, SubCategory, ProductItem, SpecGroup, SpecOption } from '../../types';
import { proxyStore } from '../../services/store';
import { ImageUpload } from '../Common/ImageUpload';
import { 
  Plus, Trash2, Edit3, Check, Layers, Image as ImageIcon, Sparkles, 
  AlertCircle, Sword, Store, FolderPlus, Tag, ShoppingBag, ArrowRight, CheckCircle2, ChevronRight, X, AlertTriangle, Lock, Unlock, Ban, Upload
} from 'lucide-react';

interface CatalogManagerProps {
  categories: Category[];
  products: ProductItem[];
  defaultTab?: 'products' | 'shops';
  onSaveProduct: (product: ProductItem) => void;
  onDeleteProduct: (productId: string) => void;
  onSaveCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  categories,
  products,
  defaultTab = 'products',
  onSaveProduct,
  onDeleteProduct,
  onSaveCategory,
  onDeleteCategory,
}) => {
  // Sub-tab: products vs shops
  const [subTab, setSubTab] = useState<'products' | 'shops'>(defaultTab);
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [searchProductQuery, setSearchProductQuery] = useState<string>('');

  // Sync subTab if defaultTab changes from parent
  useEffect(() => {
    if (defaultTab) {
      setSubTab(defaultTab);
    }
  }, [defaultTab]);

  // Product Edit / Create Modal State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [subCategoryId, setSubCategoryId] = useState(categories[0]?.subCategories[0]?.id || '');
  const [basePriceRmb, setBasePriceRmb] = useState<number>(6.5);
  const [depositRmb, setDepositRmb] = useState<number>(4);
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('詳見dc');
  const [disclaimerNotice, setDisclaimerNotice] = useState(
    '下面的價格都是台幣，以貼文時的匯率轉換計價方便參考，實際價格以收款時的匯率為準，以上價格皆不包含均攤、運費、集運費和賣貨便運費。'
  );
  const [officialTag, setOfficialTag] = useState('西山居官方旗艦店');
  const [salesNote, setSalesNote] = useState('');
  const [specNotice, setSpecNotice] = useState('');
  const [isPreorder, setIsPreorder] = useState(false);
  const [preorderEstimate, setPreorderEstimate] = useState('');
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);

  // Shop Edit / Create Modal State
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [shopBadge, setShopBadge] = useState('官方正品');
  const [shopDescription, setShopDescription] = useState('');
  const [shopIcon, setShopIcon] = useState('Store');
  const [shopIsClosed, setShopIsClosed] = useState(false);
  const [shopClosedNotice, setShopClosedNotice] = useState('手慢則無，俠士下次請早');

  // Category (商品種類) Modal State
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [targetShopId, setTargetShopId] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // In-App Confirm Modal State (replaces window.confirm which is blocked in iframes)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedShopFilter !== 'all' && p.categoryId !== selectedShopFilter) {
        return false;
      }
      if (searchProductQuery.trim()) {
        const q = searchProductQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [products, selectedShopFilter, searchProductQuery]);

  // Product Handlers
  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setName('');
    const defaultShop = categories[0]?.id || '';
    setCategoryId(defaultShop);
    const defaultCat = categories.find((c) => c.id === defaultShop)?.subCategories[0]?.id || '';
    setSubCategoryId(defaultCat);
    setBasePriceRmb(6.5);
    setDepositRmb(4);
    setCoverImage('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=700&auto=format&fit=crop&q=80');
    setDescription('詳見dc');
    setDisclaimerNotice(
      '下面的價格都是台幣，以貼文時的匯率轉換計價方便參考，實際價格以收款時的匯率為準，以上價格皆不包含均攤、運費、集運費和賣貨便運費。'
    );
    setOfficialTag('西山居官方旗艦店');
    setSalesNote('現貨拍下約2-3天發貨');
    setSpecNotice('');
    setIsPreorder(false);
    setPreorderEstimate('');
    setSpecGroups([
      {
        id: `group_${Date.now()}`,
        title: '門派貼紙',
        options: [
          { id: `opt_${Date.now()}_1`, name: '純陽', priceTwd: 30, priceOffsetRmb: 0, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80', inStock: true },
          { id: `opt_${Date.now()}_2`, name: '唐門', priceTwd: 30, priceOffsetRmb: 0, image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80', inStock: true },
          { id: `opt_${Date.now()}_3`, name: '衍天', priceTwd: 30, priceOffsetRmb: 0, image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80', inStock: true },
        ],
      },
    ]);
    setIsEditingProduct(true);
  };

  const handleOpenEditProduct = (p: ProductItem) => {
    setEditingProductId(p.id);
    setName(p.name);
    setCategoryId(p.categoryId);
    setSubCategoryId(p.subCategoryId);
    setBasePriceRmb(p.basePriceRmb);
    setDepositRmb(p.depositRmb || Math.ceil(p.basePriceRmb * 0.5));
    setCoverImage(p.coverImage);
    setDescription(p.description || '詳見dc');
    setDisclaimerNotice(
      p.disclaimerNotice ||
        '下面的價格都是台幣，以貼文時的匯率轉換計價方便參考，實際價格以收款時的匯率為準，以上價格皆不包含均攤、運費、集運費和賣貨便運費。'
    );
    setOfficialTag(p.officialTag || '西山居官方正品');
    setSalesNote(p.salesNote || '');
    setSpecNotice(p.specNotice || '');
    setIsPreorder(!!p.isPreorder);
    setPreorderEstimate(p.preorderEstimate || '');
    setSpecGroups(p.specGroups || []);
    setIsEditingProduct(true);
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const prodId = editingProductId || `prod-custom-${Date.now()}`;
    const product: ProductItem = {
      id: prodId,
      name: name.trim(),
      categoryId,
      subCategoryId,
      basePriceRmb: Number(basePriceRmb),
      depositRmb: Number(depositRmb),
      coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=700&auto=format&fit=crop&q=80',
      description: description.trim(),
      disclaimerNotice: disclaimerNotice.trim(),
      officialTag: officialTag.trim(),
      salesNote: salesNote.trim(),
      specNotice: specNotice.trim(),
      isPreorder,
      preorderEstimate: preorderEstimate.trim(),
      specGroups,
    };

    onSaveProduct(product);
    setIsEditingProduct(false);
    showToast(editingProductId ? '商品與規格已成功更新！' : '新商品已建立！');
  };

  // Spec Option helpers
  const handleAddSpecOption = (groupIndex: number) => {
    const newGroups = [...specGroups];
    const target = newGroups[groupIndex];
    const newOptId = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    target.options.push({
      id: newOptId,
      name: `新規格 ${target.options.length + 1}`,
      priceTwd: 30,
      priceOffsetRmb: 0,
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80',
      inStock: true,
      statusNote: '',
    });
    setSpecGroups(newGroups);
  };

  const handleRemoveSpecOption = (groupIndex: number, optIndex: number) => {
    const newGroups = [...specGroups];
    newGroups[groupIndex].options.splice(optIndex, 1);
    setSpecGroups(newGroups);
  };

  // ==================== SHOP HANDLERS ====================
  const handleOpenCreateShop = () => {
    setEditingShopId(null);
    setShopName('');
    setShopBadge('官方正品');
    setShopDescription('');
    setShopIcon('Store');
    setShopIsClosed(false);
    setShopClosedNotice('手慢則無，俠士下次請早');
    setIsEditingShop(true);
  };

  const handleOpenEditShop = (shop: Category) => {
    setEditingShopId(shop.id);
    setShopName(shop.name);
    setShopBadge(shop.badge || '');
    setShopDescription(shop.description || '');
    setShopIcon(shop.icon || 'Store');
    setShopIsClosed(!!shop.isClosed);
    setShopClosedNotice(shop.closedNotice || '手慢則無，俠士下次請早');
    setIsEditingShop(true);
  };

  const handleToggleShopClosed = (shop: Category) => {
    const newClosed = !shop.isClosed;
    const updated = proxyStore.toggleShopClosed(shop.id, newClosed, shop.closedNotice || '手慢則無，俠士下次請早');
    if (onSaveCategory && updated) onSaveCategory(updated);
    if (newClosed) {
      showToast(`已將店鋪「${shop.name}」切換為【閉店】狀態（前台顯示：手慢則無，俠士下次請早）`);
    } else {
      showToast(`店鋪「${shop.name}」已恢復【正常營業】！`);
    }
  };

  const handleSaveShopForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    if (editingShopId) {
      const existing = proxyStore.getCategoryById(editingShopId) || categories.find(c => c.id === editingShopId);
      const updatedShop: Category = {
        id: editingShopId,
        name: shopName.trim(),
        badge: shopBadge.trim(),
        description: shopDescription.trim(),
        icon: shopIcon,
        isClosed: shopIsClosed,
        closedNotice: shopClosedNotice.trim() || '手慢則無，俠士下次請早',
        subCategories: existing ? existing.subCategories : [
          { id: `cat_${Date.now()}_1`, name: '精選商品', description: '熱銷推薦' }
        ],
      };
      proxyStore.saveCategory(updatedShop);
      if (onSaveCategory) onSaveCategory(updatedShop);
      showToast(`店鋪「${shopName}」已更新！`);
    } else {
      const newShopId = `shop_${Date.now()}`;
      const newShop: Category = {
        id: newShopId,
        name: shopName.trim(),
        badge: shopBadge.trim(),
        description: shopDescription.trim(),
        icon: shopIcon,
        isClosed: shopIsClosed,
        closedNotice: shopClosedNotice.trim() || '手慢則無，俠士下次請早',
        subCategories: [
          { id: `cat_${Date.now()}_1`, name: '熱門周邊', description: '店鋪精選' },
        ],
      };
      proxyStore.saveCategory(newShop);
      if (onSaveCategory) onSaveCategory(newShop);
      showToast(`新店鋪「${shopName}」已建立！`);
    }
    setIsEditingShop(false);
  };

  const handleDeleteShopPrompt = (shopId: string, shopTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: '確定刪除店鋪？',
      message: `您即將刪除店鋪「${shopTitle}」，該店鋪底下的所有商品種類亦將一併移除。此操作無法復原。`,
      confirmLabel: '確認刪除店鋪',
      onConfirm: () => {
        proxyStore.deleteCategory(shopId);
        if (onDeleteCategory) onDeleteCategory(shopId);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(`店鋪「${shopTitle}」已成功刪除！`);
      },
    });
  };

  // ==================== CATEGORY (種類) HANDLERS ====================
  const handleOpenCreateCategory = (shopId: string) => {
    setTargetShopId(shopId);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryDesc('');
    setIsEditingCategory(true);
  };

  const handleOpenEditCategory = (shopId: string, cat: SubCategory) => {
    setTargetShopId(shopId);
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setIsEditingCategory(true);
  };

  const handleSaveCategoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !targetShopId) return;

    if (editingCategoryId) {
      proxyStore.updateSubCategory(targetShopId, {
        id: editingCategoryId,
        name: categoryName.trim(),
        description: categoryDesc.trim(),
      });
      showToast(`商品種類「${categoryName}」已更新！`);
    } else {
      const newCatId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      proxyStore.addSubCategory(targetShopId, {
        id: newCatId,
        name: categoryName.trim(),
        description: categoryDesc.trim(),
      });
      showToast(`商品種類「${categoryName}」已加入！`);
    }
    setIsEditingCategory(false);
  };

  const handleDeleteCategoryPrompt = (shopId: string, catId: string, catTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: '確定刪除商品種類？',
      message: `確定要刪除商品種類「${catTitle}」嗎？`,
      confirmLabel: '確認刪除種類',
      onConfirm: () => {
        proxyStore.deleteSubCategory(shopId, catId);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(`商品種類「${catTitle}」已刪除！`);
      },
    });
  };

  const handleDeleteProductPrompt = (pId: string, pName: string) => {
    setConfirmModal({
      isOpen: true,
      title: '確定刪除商品？',
      message: `確定要刪除「${pName}」嗎？`,
      confirmLabel: '確認刪除商品',
      onConfirm: () => {
        onDeleteProduct(pId);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(`商品「${pName}」已刪除！`);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#223147] text-[#FAF7F2] font-bold px-4 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2 border border-[#C5922E]">
          <CheckCircle2 className="w-5 h-5 text-[#C5922E]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sub Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#DDD5C7] shadow-xs">
        <div>
          <h3 className="text-lg font-extrabold text-[#1E2530] flex items-center gap-2">
            <Store className="w-5 h-5 text-[#C5922E]" />
            <span>店鋪、商品種類與規格管理</span>
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            自由新增、編輯與刪除「店鋪」及「商品種類」，設定商品說明與多規格按鈕。
          </p>
        </div>

        {/* SubTab Toggle */}
        <div className="flex items-center gap-2 bg-[#FAF7F2] p-1.5 rounded-xl border border-[#DDD5C7]">
          <button
            id="btn-subtab-shops"
            onClick={() => setSubTab('shops')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'shops'
                ? 'bg-[#223147] text-[#E2B755] shadow-xs border border-[#C5922E]/40'
                : 'text-[#4A5568] hover:text-[#1E2530]'
            }`}
          >
            <Store className="w-4 h-4 text-[#C5922E]" />
            <span>店鋪與種類設定 ({categories.length})</span>
          </button>

          <button
            id="btn-subtab-products"
            onClick={() => setSubTab('products')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'products'
                ? 'bg-[#223147] text-[#E2B755] shadow-xs border border-[#C5922E]/40'
                : 'text-[#4A5568] hover:text-[#1E2530]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#C5922E]" />
            <span>商品清單與規格 ({products.length})</span>
          </button>
        </div>
      </div>

      {/* ===================== VIEW 1: SHOPS & CATEGORIES TAB ===================== */}
      {subTab === 'shops' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#DDD5C7]">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#C5922E]" />
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#1E2530]">
                  店鋪列表 (目前共 {categories.length} 間店鋪)
                </h4>
                <p className="text-xs text-[#6B7280]">可直接點擊「編輯店鋪」修改名稱或「刪除店鋪」，亦可在店鋪內新增商品種類。</p>
              </div>
            </div>

            <button
              id="btn-admin-add-shop"
              onClick={handleOpenCreateShop}
              className="px-4 py-2.5 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-[#C5922E]/40 shrink-0"
            >
              <Plus className="w-4 h-4 text-[#C5922E]" />
              <span>＋ 新增店鋪</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {categories.map((shop) => {
              const shopProductsCount = products.filter((p) => p.categoryId === shop.id).length;

              return (
                <div
                  key={shop.id}
                  id={`admin-shop-card-${shop.id}`}
                  className="p-5 rounded-2xl bg-white border border-[#DDD5C7] space-y-4 shadow-xs hover:border-[#C5922E]/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Shop Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#DDD5C7]">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C5922E] text-white">
                            {shop.badge || '官方店鋪'}
                          </span>

                          {shop.isClosed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#A63434] text-white flex items-center gap-1 shadow-2xs">
                              <Lock className="w-3 h-3" />
                              <span>已閉店</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#2A6B48] text-white flex items-center gap-1 shadow-2xs">
                              <Check className="w-3 h-3" />
                              <span>營業中</span>
                            </span>
                          )}

                          <h4 className="font-extrabold text-base sm:text-lg text-[#1E2530]">{shop.name}</h4>
                        </div>
                        <p className="text-xs text-[#6B7280]">{shop.description || '暫無簡介說明'}</p>
                        <div className="text-[11px] font-semibold text-[#4A5568]">
                          包含 <strong className="text-[#C5922E]">{shop.subCategories.length}</strong> 個種類，共 <strong className="text-[#1E2530]">{shopProductsCount}</strong> 款商品
                        </div>
                      </div>

                      {/* Shop Actions: Close/Open Toggle, Edit, Delete */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {/* 閉店 / 恢復開店按鈕 */}
                        <button
                          id={`btn-toggle-closed-shop-${shop.id}`}
                          onClick={() => handleToggleShopClosed(shop)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all border shadow-2xs ${
                            shop.isClosed
                              ? 'bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                              : 'bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#A63434] border-[#FFCCC7]'
                          }`}
                          title={shop.isClosed ? '點擊恢復開店營業' : '點擊切換為閉店狀態'}
                        >
                          {shop.isClosed ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>恢復開店</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>閉店</span>
                            </>
                          )}
                        </button>

                        <button
                          id={`btn-edit-shop-${shop.id}`}
                          onClick={() => handleOpenEditShop(shop)}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#1E2530] border border-[#DDD5C7] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="編輯店鋪資訊"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#C5922E]" />
                          <span>編輯店鋪</span>
                        </button>

                        <button
                          id={`btn-delete-shop-${shop.id}`}
                          onClick={() => handleDeleteShopPrompt(shop.id, shop.name)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#A63434] border border-[#E8C4C4] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="刪除此店鋪"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>刪除</span>
                        </button>
                      </div>
                    </div>

                    {/* Closed Notice Banner on Shop Card */}
                    {shop.isClosed && (
                      <div className="p-2.5 rounded-xl bg-[#FFF2F0] border border-[#FFCCC7] flex items-center justify-between gap-2 text-xs font-bold text-[#CF1322] shadow-2xs">
                        <div className="flex items-center gap-1.5">
                          <Ban className="w-4 h-4 shrink-0 text-[#CF1322]" />
                          <span>
                            【閉店中】{shop.closedNotice || '手慢則無，俠士下次請早'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#A63434] bg-white px-2 py-0.5 rounded-md border border-[#FFCCC7] shrink-0 font-medium">
                          前台已停用下單
                        </span>
                      </div>
                    )}

                    {/* Sub Categories inside this shop */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#4A5568]">
                        <span>所屬【商品種類】：</span>
                        <button
                          onClick={() => handleOpenCreateCategory(shop.id)}
                          className="text-[#C5922E] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>新增商品種類</span>
                        </button>
                      </div>

                      {shop.subCategories.length === 0 ? (
                        <div className="p-4 rounded-xl bg-[#FAF7F2] border border-dashed border-[#DDD5C7] text-center text-xs text-[#6B7280]">
                          尚未建立任何商品種類，請點擊上方「新增商品種類」
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {shop.subCategories.map((subCat) => {
                            const countInSubCat = products.filter(
                              (p) => p.categoryId === shop.id && p.subCategoryId === subCat.id
                            ).length;

                            return (
                              <div
                                key={subCat.id}
                                className="p-3 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-between gap-2"
                              >
                                <div className="truncate">
                                  <div className="text-xs font-bold text-[#1E2530] truncate">
                                    {subCat.name}
                                  </div>
                                  <div className="text-[10px] text-[#6B7280]">
                                    {countInSubCat} 款商品
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleOpenEditCategory(shop.id, subCat)}
                                    className="p-1.5 rounded bg-white hover:bg-[#EDE7DC] text-[#4A5568] border border-[#DDD5C7] text-[11px] cursor-pointer"
                                    title="編輯種類名稱"
                                  >
                                    <Edit3 className="w-3 h-3 text-[#C5922E]" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategoryPrompt(shop.id, subCat.id, subCat.name)}
                                    className="p-1.5 rounded bg-white hover:bg-[#FFEBEB] text-[#A63434] border border-[#E8C4C4] text-[11px] cursor-pointer"
                                    title="刪除種類"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: PRODUCTS TAB ===================== */}
      {subTab === 'products' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#DDD5C7]">
            <div className="flex items-center gap-2 flex-1">
              <select
                value={selectedShopFilter}
                onChange={(e) => setSelectedShopFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-bold text-[#1E2530] outline-none cursor-pointer"
              >
                <option value="all">所有店鋪 ({products.length} 款)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({products.filter((p) => p.categoryId === c.id).length})
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="搜尋品名或說明..."
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs text-[#1E2530] outline-none"
              />
            </div>

            <button
              id="btn-admin-create-product"
              onClick={handleOpenCreateProduct}
              className="px-4 py-2.5 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-[#C5922E]/40 shrink-0"
            >
              <Plus className="w-4 h-4 text-[#C5922E]" />
              <span>新增商品與規格</span>
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const shop = categories.find((c) => c.id === p.categoryId);
              const shopName = shop?.name || p.categoryId;
              const catName = shop?.subCategories.find((s) => s.id === p.subCategoryId)?.name || p.subCategoryId;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white border border-[#DDD5C7] flex flex-col justify-between space-y-3 shadow-xs hover:border-[#C5922E] transition-all"
                >
                  <div className="space-y-2.5">
                    {/* Cover image & badges */}
                    <div className="aspect-video rounded-xl bg-[#FAF7F2] overflow-hidden relative border border-[#DDD5C7]">
                      <img
                        src={p.coverImage}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#223147] text-white border border-[#C5922E]/40 shadow-xs">
                          {shopName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C5922E] text-white shadow-xs">
                          {catName}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-[#1E2530] line-clamp-2">{p.name}</h4>

                    {/* Description preview */}
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs space-y-1 text-[#4A5568]">
                      <div className="flex items-center gap-1 font-semibold text-[#1E2530]">
                        <span className="text-[#C5922E]">ⓘ 商品說明:</span>
                        <span className="truncate">{p.description || '詳見dc'}</span>
                      </div>
                    </div>

                    {/* Spec counts */}
                    <div className="flex flex-wrap gap-1 text-[11px] text-[#4A5568]">
                      {p.specGroups.map((g) => (
                        <span key={g.id} className="bg-[#FAF7F2] border border-[#DDD5C7] px-2 py-0.5 rounded font-medium">
                          {g.title}: {g.options.length}款
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#DDD5C7] flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE7DC] text-xs font-bold text-[#1E2530] border border-[#DDD5C7] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#C5922E]" />
                      <span>編輯規格與說明</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProductPrompt(p.id, p.name)}
                      className="p-1.5 rounded-xl bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#A63434] border border-[#E8C4C4] cursor-pointer transition-colors"
                      title="刪除商品"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: PRODUCT CREATE / EDIT ===================== */}
      {isEditingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div
            className="relative w-full max-w-2xl bg-white border border-[#DDD5C7] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#1E2530] my-8 max-h-[90vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsEditingProduct(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#6B7280] flex items-center justify-center font-bold text-sm cursor-pointer border border-[#DDD5C7]"
            >
              ✕
            </button>

            <h3 className="text-xl font-extrabold text-[#1E2530] flex items-center gap-2 border-b border-[#DDD5C7] pb-3">
              <Store className="w-5 h-5 text-[#C5922E]" />
              <span>{editingProductId ? '編輯商品與按鈕規格' : '新增商品與多規格按鈕'}</span>
            </h3>

            <form onSubmit={handleSaveProductForm} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">商品完整品名</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 【劍網3】全門派Q版手帳貼紙 / 防水行李箱貼"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#C5922E]"
                />
              </div>

              {/* Shop & Product Category selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">所屬店鋪 (大分類)</label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setCategoryId(newCatId);
                      const cat = categories.find((c) => c.id === newCatId);
                      if (cat && cat.subCategories.length > 0) {
                        setSubCategoryId(cat.subCategories[0].id);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E2530]">所屬商品種類</label>
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none"
                  >
                    {categories
                      .find((c) => c.id === categoryId)
                      ?.subCategories.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Description (ⓘ 商品說明) */}
              <div className="space-y-1">
                <label className="font-bold text-[#1E2530] flex items-center gap-1">
                  <span className="text-[#C5922E]">ⓘ 商品說明</span>
                  <span className="text-[11px] text-[#6B7280] font-normal">(顯示於前台上方說明框)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如: 詳見dc 或 詳細商品做工尺寸介紹"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none resize-none focus:border-[#C5922E]"
                />
              </div>

              {/* Disclaimer Notice (警語/匯率條款) */}
              <div className="space-y-1">
                <label className="font-bold text-[#1E2530] flex items-center gap-1">
                  <span className="text-[#A63434]">⚠️ 注意事項 / 匯率條款</span>
                  <span className="text-[11px] text-[#6B7280] font-normal">(顯示於商品說明正下方的提醒框)</span>
                </label>
                <textarea
                  rows={2}
                  value={disclaimerNotice}
                  onChange={(e) => setDisclaimerNotice(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none resize-none focus:border-[#C5922E]"
                />
              </div>

              {/* Cover Image URL / Local Upload */}
              <div className="space-y-1">
                <ImageUpload
                  label="商品主封面圖 (可直接上傳本機圖片，免圖床)"
                  value={coverImage}
                  onChange={(val) => setCoverImage(val)}
                  previewSize="md"
                  placeholder="或貼上圖片 URL (如 https://...)"
                />
              </div>

              {/* Spec Groups configuration */}
              <div className="space-y-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2530] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-[#223147] text-white text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    規格設定與款式選項 (支援單卡圖片、名稱、台幣售價、完售標記)
                  </span>
                </div>

                {/* 規格處全局公告標語 (可自訂編輯) */}
                <div className="p-3 rounded-xl bg-white border border-[#DDD5C7] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="font-extrabold text-xs text-[#1E2530] flex items-center gap-1.5">
                      <span className="text-[#CF1322]">📢 規格處公告 / 狀態標語</span>
                      <span className="text-[11px] text-[#6B7280] font-normal">(顯示於前台規格選擇區塊頂部)</span>
                    </label>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSpecNotice('已完售，預計年末或明年初再販')}
                        className="px-2.5 py-1 rounded-lg bg-[#FFF2F0] hover:bg-[#FFEBEB] text-[#CF1322] border border-[#FFCCC7] text-xs font-bold cursor-pointer transition-colors"
                      >
                        + 填入【已完售，預計年末或明年初再販】
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecNotice('預售商品，請耐心等待')}
                        className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-bold cursor-pointer transition-colors"
                      >
                        + 填入【預售商品，請耐心等待】
                      </button>
                      {specNotice && (
                        <button
                          type="button"
                          onClick={() => setSpecNotice('')}
                          className="px-2 py-1 text-xs text-[#6B7280] hover:text-[#A63434] cursor-pointer"
                        >
                          清除
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={specNotice}
                    onChange={(e) => setSpecNotice(e.target.value)}
                    placeholder="例如: 已完售，預計年末或明年初再販 (前台將顯示 【...】)"
                    className="w-full p-2.5 rounded-lg bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-bold text-[#1E2530] outline-none focus:border-[#C5922E]"
                  />
                </div>

                {specGroups.map((group, gIdx) => (
                  <div key={group.id} className="space-y-3 p-3.5 rounded-xl bg-white border border-[#DDD5C7]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="text"
                        value={group.title}
                        onChange={(e) => {
                          const newGroups = [...specGroups];
                          newGroups[gIdx].title = e.target.value;
                          setSpecGroups(newGroups);
                        }}
                        className="flex-1 p-2 rounded-lg bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-bold text-[#1E2530] outline-none focus:border-[#C5922E]"
                        placeholder="群組標題 (例如: 門派貼紙、款式選擇)"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSpecOption(gIdx)}
                        className="px-3 py-1.5 rounded-lg bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] font-bold text-xs shrink-0 cursor-pointer transition-colors"
                      >
                        + 加規格選項
                      </button>
                    </div>

                    {/* Options list with image, name, price, statusNote, inStock */}
                    <div className="space-y-2.5">
                      {group.options.map((opt, oIdx) => {
                        const isSoldOut = opt.inStock === false || (opt.statusNote && (opt.statusNote.includes('完售') || opt.statusNote.includes('售罄')));

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                              isSoldOut ? 'bg-[#FFF9F9] border-[#FFCCC7]' : 'bg-[#FAF7F2] border-[#DDD5C7]'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              {/* Option Name */}
                              <input
                                type="text"
                                value={opt.name}
                                onChange={(e) => {
                                  const newGroups = [...specGroups];
                                  newGroups[gIdx].options[oIdx].name = e.target.value;
                                  setSpecGroups(newGroups);
                                }}
                                className="w-full sm:w-32 p-2 rounded-lg bg-white border border-[#DDD5C7] text-xs font-bold text-[#1E2530] outline-none"
                                placeholder="規格名 (如: 純陽)"
                              />

                              {/* Price */}
                              <div className="flex items-center gap-1 w-full sm:w-28 shrink-0">
                                <span className="text-xs text-[#6B7280]">NT$</span>
                                <input
                                  type="number"
                                  value={opt.priceTwd || 30}
                                  onChange={(e) => {
                                    const newGroups = [...specGroups];
                                    newGroups[gIdx].options[oIdx].priceTwd = Number(e.target.value);
                                    setSpecGroups(newGroups);
                                  }}
                                  className="w-full p-2 rounded-lg bg-white border border-[#DDD5C7] text-xs font-bold text-[#C5922E] outline-none"
                                  placeholder="台幣價"
                                />
                              </div>

                              {/* Image Input with quick upload */}
                              <div className="w-full sm:flex-1 flex items-center gap-1">
                                <input
                                  type="text"
                                  value={opt.image?.startsWith('data:') ? '【本機圖片】' : (opt.image || '')}
                                  onChange={(e) => {
                                    if (!e.target.value.includes('本機圖片')) {
                                      const newGroups = [...specGroups];
                                      newGroups[gIdx].options[oIdx].image = e.target.value;
                                      setSpecGroups(newGroups);
                                    }
                                  }}
                                  className="w-full p-2 rounded-lg bg-white border border-[#DDD5C7] text-xs text-[#4A5568] outline-none truncate"
                                  placeholder="規格縮圖 URL / 選填"
                                />
                                <label className="p-2 rounded-lg bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] text-xs cursor-pointer shrink-0 transition-colors flex items-center gap-1 font-bold" title="從本機上傳規格縮圖">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">上傳</span>
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
                                            const newGroups = [...specGroups];
                                            newGroups[gIdx].options[oIdx].image = base64;
                                            setSpecGroups(newGroups);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveSpecOption(gIdx, oIdx)}
                                className="text-[#6B7280] hover:text-[#A63434] p-1.5 rounded-lg bg-white border border-[#DDD5C7] text-xs cursor-pointer transition-colors shrink-0"
                                title="刪除選項"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Option Status Note Row */}
                            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-[#DDD5C7]/60">
                              <div className="flex items-center gap-1.5 w-full sm:flex-1">
                                <span className="text-[11px] font-bold text-[#CF1322] shrink-0">狀態標籤:</span>
                                <input
                                  type="text"
                                  value={opt.statusNote || ''}
                                  onChange={(e) => {
                                    const newGroups = [...specGroups];
                                    newGroups[gIdx].options[oIdx].statusNote = e.target.value;
                                    setSpecGroups(newGroups);
                                  }}
                                  className="flex-1 p-1.5 rounded-lg bg-white border border-[#DDD5C7] text-xs text-[#CF1322] font-semibold outline-none"
                                  placeholder="例如: 已完售，預計年末或明年初再販"
                                />
                              </div>

                              {/* Quick Fill Buttons for Status Note */}
                              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newGroups = [...specGroups];
                                    const curr = newGroups[gIdx].options[oIdx];
                                    if (curr.statusNote === '預售商品，請耐心等待') {
                                      curr.statusNote = '';
                                    } else {
                                      curr.statusNote = '預售商品，請耐心等待';
                                    }
                                    setSpecGroups(newGroups);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                                    opt.statusNote === '預售商品，請耐心等待'
                                      ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                                      : 'bg-white hover:bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                                  }`}
                                >
                                  {opt.statusNote === '預售商品，請耐心等待' ? '✓ 預售中' : '+ 填入【預售】'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newGroups = [...specGroups];
                                    const curr = newGroups[gIdx].options[oIdx];
                                    if (curr.statusNote === '已完售，預計年末或明年初再販') {
                                      curr.statusNote = '';
                                      curr.inStock = true;
                                    } else {
                                      curr.statusNote = '已完售，預計年末或明年初再販';
                                      curr.inStock = false;
                                    }
                                    setSpecGroups(newGroups);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                                    isSoldOut
                                      ? 'bg-[#CF1322] text-white border-[#CF1322]'
                                      : 'bg-white hover:bg-[#FFF2F0] text-[#CF1322] border-[#FFCCC7]'
                                  }`}
                                >
                                  {isSoldOut ? '✓ 已設完售' : '標記【完售】'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-[#DDD5C7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProduct(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#4A5568] font-bold text-xs cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] font-bold text-xs sm:text-sm shadow-xs cursor-pointer border border-[#C5922E]/40"
                >
                  儲存商品與規格
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: SHOP CREATE / EDIT ===================== */}
      {isEditingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div
            className="relative w-full max-w-md bg-white border border-[#DDD5C7] rounded-2xl p-6 shadow-2xl text-[#1E2530] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsEditingShop(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#6B7280] flex items-center justify-center font-bold text-sm cursor-pointer border border-[#DDD5C7]"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-[#1E2530] flex items-center gap-2 border-b border-[#DDD5C7] pb-3">
              <Store className="w-5 h-5 text-[#C5922E]" />
              <span>{editingShopId ? '編輯店鋪' : '新增店鋪（大分類）'}</span>
            </h3>

            <form onSubmit={handleSaveShopForm} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">店鋪名稱 <span className="text-[#A63434]">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="例如: 西山居官方旗艦店"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#C5922E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">特色標籤 / Badge</label>
                <input
                  type="text"
                  placeholder="例如: 官方正品、熱銷爆款、限量特典"
                  value={shopBadge}
                  onChange={(e) => setShopBadge(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#C5922E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">店鋪簡介說明</label>
                <textarea
                  rows={2}
                  placeholder="例如: 劍網3十九門派貼紙、壓克力立牌與官方授權周邊"
                  value={shopDescription}
                  onChange={(e) => setShopDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none resize-none focus:border-[#C5922E]"
                />
              </div>

              {/* 店鋪營業狀態與閉店設定 */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-[#1E2530] flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#C5922E]" />
                    <span>店鋪營業狀態</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShopIsClosed(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        !shopIsClosed
                          ? 'bg-[#2A6B48] text-white border-[#2A6B48] shadow-2xs'
                          : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      ✓ 營業中
                    </button>
                    <button
                      type="button"
                      onClick={() => setShopIsClosed(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        shopIsClosed
                          ? 'bg-[#A63434] text-white border-[#A63434] shadow-2xs'
                          : 'bg-white text-[#4A5568] border-[#DDD5C7] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <Lock className="w-3 h-3 inline mr-1" />
                      已閉店 (暫停接單)
                    </button>
                  </div>
                </div>

                {shopIsClosed && (
                  <div className="space-y-1.5 pt-2 border-t border-[#DDD5C7]/70 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#CF1322]">📢 閉店提示標語:</span>
                      <button
                        type="button"
                        onClick={() => setShopClosedNotice('手慢則無，俠士下次請早')}
                        className="text-[11px] text-[#C5922E] hover:underline font-bold cursor-pointer"
                      >
                        重設為預設標語
                      </button>
                    </div>
                    <input
                      type="text"
                      value={shopClosedNotice}
                      onChange={(e) => setShopClosedNotice(e.target.value)}
                      placeholder="手慢則無，俠士下次請早"
                      className="w-full p-2 rounded-lg bg-white border border-[#FFCCC7] text-xs font-bold text-[#CF1322] outline-none"
                    />
                    <p className="text-[10px] text-[#A63434]">
                      ※ 閉店後前台將醒目展示此提示並全面關閉該店所有商品的加入代購單與結帳下單功能。
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#DDD5C7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingShop(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#4A5568] font-bold text-xs cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] font-bold text-xs sm:text-sm shadow-xs cursor-pointer border border-[#C5922E]/40"
                >
                  {editingShopId ? '儲存店鋪變更' : '立即建立店鋪'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: PRODUCT CATEGORY CREATE / EDIT ===================== */}
      {isEditingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div
            className="relative w-full max-w-md bg-white border border-[#DDD5C7] rounded-2xl p-6 shadow-2xl text-[#1E2530] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsEditingCategory(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#6B7280] flex items-center justify-center font-bold text-sm cursor-pointer border border-[#DDD5C7]"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-[#1E2530] flex items-center gap-2 border-b border-[#DDD5C7] pb-3">
              <FolderPlus className="w-5 h-5 text-[#C5922E]" />
              <span>{editingCategoryId ? '編輯商品種類' : '新增商品種類'}</span>
            </h3>

            <form onSubmit={handleSaveCategoryForm} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">商品種類名稱 <span className="text-[#A63434]">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="例如: 門派貼紙、大立牌 / 流沙立牌"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#C5922E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E2530]">種類描述說明 (選填)</label>
                <input
                  type="text"
                  placeholder="例如: 高質感防水手帳貼紙、Q版全門派"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-[#1E2530] outline-none focus:border-[#C5922E]"
                />
              </div>

              <div className="pt-3 border-t border-[#DDD5C7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCategory(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#4A5568] font-bold text-xs cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] font-bold text-xs shadow-xs cursor-pointer border border-[#C5922E]/40"
                >
                  儲存種類
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: IN-APP CONFIRMATION MODAL ===================== */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="relative w-full max-w-sm bg-white border border-[#DDD5C7] rounded-2xl p-6 shadow-2xl text-[#1E2530] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-[#A63434]">
              <div className="w-10 h-10 rounded-full bg-[#FFF5F5] border border-[#E8C4C4] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#A63434]" />
              </div>
              <h4 className="font-extrabold text-base text-[#1E2530]">{confirmModal.title}</h4>
            </div>

            <p className="text-xs text-[#4A5568] leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE7DC] text-[#4A5568] font-bold text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-xl bg-[#A63434] hover:bg-[#8F2828] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                {confirmModal.confirmLabel || '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
