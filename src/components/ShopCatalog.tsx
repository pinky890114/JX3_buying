import React, { useState, useMemo, useEffect } from 'react';
import { Category, SubCategory, ProductItem, SpecGroup, SpecOption, CartItem } from '../types';
import { proxyStore } from '../services/store';
import { 
  ShoppingBag, ShoppingCart, Check, Sparkles, Layers, ShieldCheck, 
  HelpCircle, Plus, Minus, Eye, ArrowRight, Tag, Info, AlertCircle, ArrowLeft, Store, CheckCircle2,
  Lock, Ban
} from 'lucide-react';

interface ShopCatalogProps {
  categories: Category[];
  products: ProductItem[];
  onAddToCart: (item: Omit<CartItem, 'cartItemId'>) => void;
  onInstantOrder: (item: Omit<CartItem, 'cartItemId'>) => void;
  onBackHome?: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
}

export const ShopCatalog: React.FC<ShopCatalogProps> = ({
  categories,
  products,
  onAddToCart,
  onInstantOrder,
  onBackHome,
  onOpenCart,
  cartCount = 0,
}) => {
  // Step 1: Selected Shop (店鋪)
  const [selectedShopId, setSelectedShopId] = useState<string>(categories[0]?.id || '');

  const currentShop = useMemo(() => {
    return categories.find((c) => c.id === selectedShopId) || categories[0];
  }, [categories, selectedShopId]);

  const isCurrentShopClosed = !!currentShop?.isClosed;
  const closedNotice = currentShop?.closedNotice || '手慢則無，俠士下次請早';

  // Step 2: Selected Product Category (商品種類)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    currentShop?.subCategories[0]?.id || ''
  );

  // When Shop changes, auto-select first Product Category
  const handleSelectShop = (shopId: string) => {
    setSelectedShopId(shopId);
    const shop = categories.find((c) => c.id === shopId);
    if (shop && shop.subCategories.length > 0) {
      setSelectedCategoryId(shop.subCategories[0].id);
    } else {
      setSelectedCategoryId('');
    }
  };

  // Products under active Shop and Product Category
  const matchingProducts = useMemo(() => {
    if (!selectedShopId) return products;
    return products.filter((p) => {
      if (p.categoryId !== selectedShopId) return false;
      if (selectedCategoryId && p.subCategoryId !== selectedCategoryId) return false;
      return true;
    });
  }, [products, selectedShopId, selectedCategoryId]);

  // Quantity tracker for each spec option: { [optionId: string]: number }
  const [specQuantities, setSpecQuantities] = useState<{ [optId: string]: number }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reset spec quantities when shop or category changes
  useEffect(() => {
    setSpecQuantities({});
  }, [selectedShopId, selectedCategoryId]);

  // Handlers for spec counter
  const handleIncreaseQty = (optId: string) => {
    if (isCurrentShopClosed) {
      setToastMessage('手慢則無，俠士下次請早！此店鋪已閉店暫停下單。');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setSpecQuantities((prev) => ({
      ...prev,
      [optId]: (prev[optId] || 0) + 1,
    }));
  };

  const handleDecreaseQty = (optId: string) => {
    if (isCurrentShopClosed) return;
    setSpecQuantities((prev) => {
      const current = prev[optId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[optId];
        return next;
      }
      return {
        ...prev,
        [optId]: current - 1,
      };
    });
  };

  const handleSetQty = (optId: string, val: number) => {
    if (isCurrentShopClosed) return;
    if (val <= 0) {
      setSpecQuantities((prev) => {
        const next = { ...prev };
        delete next[optId];
        return next;
      });
    } else {
      setSpecQuantities((prev) => ({
        ...prev,
        [optId]: val,
      }));
    }
  };

  // Compute total selected items & price across all matching products in this category
  const selectedSummary = useMemo(() => {
    if (matchingProducts.length === 0 || isCurrentShopClosed) {
      return { totalCount: 0, totalTwd: 0, items: [] };
    }

    let totalCount = 0;
    let totalTwd = 0;
    const items: Array<{
      productId: string;
      productName: string;
      productCoverImage: string;
      groupTitle: string;
      option: SpecOption;
      qty: number;
      priceTwd: number;
      priceRmb: number;
    }> = [];

    matchingProducts.forEach((prod) => {
      prod.specGroups.forEach((group) => {
        group.options.forEach((opt) => {
          const qty = specQuantities[opt.id] || 0;
          if (qty > 0) {
            const unitTwd = opt.priceTwd 
              ? opt.priceTwd 
              : proxyStore.calculateTwd(prod.basePriceRmb + (opt.priceOffsetRmb || 0));
            const unitRmb = prod.basePriceRmb + (opt.priceOffsetRmb || 0);

            totalCount += qty;
            totalTwd += unitTwd * qty;
            items.push({
              productId: prod.id,
              productName: prod.name,
              productCoverImage: prod.coverImage,
              groupTitle: group.title,
              option: opt,
              qty,
              priceTwd: unitTwd,
              priceRmb: unitRmb,
            });
          }
        });
      });
    });

    return { totalCount, totalTwd, items };
  }, [matchingProducts, specQuantities, isCurrentShopClosed]);

  // Batch add selected specs to cart
  const handleAddBatchToCart = () => {
    if (isCurrentShopClosed) {
      setToastMessage('手慢則無，俠士下次請早！此店鋪已閉店暫停下單。');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (selectedSummary.items.length === 0) {
      setToastMessage('請先在下方規格清單中選擇數量！');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    selectedSummary.items.forEach((item) => {
      const depositTwd = Math.ceil(item.priceTwd * 0.5);
      onAddToCart({
        productId: item.productId,
        productName: item.productName,
        coverImage: item.option.image || item.productCoverImage,
        selectedSpecs: {
          [item.groupTitle]: item.option,
        },
        unitPriceRmb: item.priceRmb,
        unitPriceTwd: item.priceTwd,
        quantity: item.qty,
        depositTwd,
      });
    });

    setToastMessage(`已將 ${selectedSummary.totalCount} 件商品加入代購單！`);
    setTimeout(() => setToastMessage(null), 3000);
    setSpecQuantities({});
  };

  // Instant Checkout
  const handleBatchInstantCheckout = () => {
    if (isCurrentShopClosed) {
      setToastMessage('手慢則無，俠士下次請早！此店鋪已閉店暫停下單。');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (selectedSummary.items.length === 0) {
      setToastMessage('請先在下方規格清單中選擇數量！');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const firstItem = selectedSummary.items[0];
    const depositTwd = Math.ceil(firstItem.priceTwd * 0.5);

    // If there are multiple items, add the others to cart first
    selectedSummary.items.slice(1).forEach((item) => {
      onAddToCart({
        productId: item.productId,
        productName: item.productName,
        coverImage: item.option.image || item.productCoverImage,
        selectedSpecs: {
          [item.groupTitle]: item.option,
        },
        unitPriceRmb: item.priceRmb,
        unitPriceTwd: item.priceTwd,
        quantity: item.qty,
        depositTwd: Math.ceil(item.priceTwd * 0.5),
      });
    });

    onInstantOrder({
      productId: firstItem.productId,
      productName: firstItem.productName,
      coverImage: firstItem.option.image || firstItem.productCoverImage,
      selectedSpecs: {
        [firstItem.groupTitle]: firstItem.option,
      },
      unitPriceRmb: firstItem.priceRmb,
      unitPriceTwd: firstItem.priceTwd,
      quantity: firstItem.qty,
      depositTwd,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#223147] text-[#FAF7F2] font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-[#C5922E] animate-fade-in">
          <Check className="w-4 h-4 bg-[#C5922E] text-white rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Page Action Strip: Return to Home & View Cart */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#DDD5C7]">
        {onBackHome && (
          <button
            onClick={onBackHome}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#223147] border border-[#DDD5C7] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#C5922E]" />
            <span>返回首頁</span>
          </button>
        )}

        <div className="text-center hidden sm:block">
          <h2 className="text-base font-extrabold text-[#1E2530] tracking-wide">
            劍俠情緣參・周邊選購
          </h2>
          <span className="text-[11px] text-[#6B7280]">官方正品・多規格選單直填</span>
        </div>

        {onOpenCart && (
          <button
            onClick={onOpenCart}
            className="px-4 py-2 rounded-xl bg-[#223147] hover:bg-[#1A2536] text-white border border-[#C5922E] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-[#C5922E]" />
            <span>代購單</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#C5922E] text-white font-bold text-[11px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* === STEP 1: 店鋪按鈕選單 (Shop Selection) === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-[#1E2530] flex items-center gap-2 tracking-wide">
            <span className="w-5 h-5 rounded-md bg-[#223147] text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            第一步：請選擇【店鋪】
          </label>
          <span className="text-xs text-[#6B7280]">共 {categories.length} 間店鋪</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((shop) => {
            const isSelected = shop.id === selectedShopId;
            return (
              <button
                key={shop.id}
                id={`btn-shop-${shop.id}`}
                onClick={() => handleSelectShop(shop.id)}
                className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#223147] border-[#C5922E] text-white shadow-md'
                    : 'bg-white border-[#DDD5C7] hover:border-[#C5922E] text-[#1E2530]'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isSelected ? 'bg-[#C5922E] text-white' : 'bg-[#F2ECE1] text-[#8C6B28]'
                      }`}
                    >
                      {shop.badge || '店鋪'}
                    </span>

                    {shop.isClosed && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#A63434] text-white flex items-center gap-0.5 shadow-2xs">
                        <Lock className="w-2.5 h-2.5" />
                        已閉店
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#C5922E] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="font-extrabold text-sm sm:text-base">{shop.name}</div>
                  <div
                    className={`text-xs mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-gray-300' : 'text-[#6B7280]'
                    }`}
                  >
                    {shop.isClosed
                      ? (shop.closedNotice || '手慢則無，俠士下次請早')
                      : (shop.description || '官方精選商品')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* === CLOSED SHOP BANNER (俠士下次請早) === */}
      {isCurrentShopClosed && (
        <div className="p-5 sm:p-6 rounded-2xl bg-linear-to-r from-[#FFF5F5] via-[#FFF0F0] to-[#FFF5F5] border-2 border-[#FFCCC7] shadow-sm space-y-3 animate-fade-in text-[#1E2530]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#CF1322] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#CF1322] text-white text-[11px] font-extrabold tracking-wide shadow-2xs">
                    暫停接單・已閉店
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#1E2530]">
                    【{currentShop.name}】
                  </h3>
                </div>
                <p className="text-base sm:text-lg font-black text-[#CF1322] mt-1 tracking-wide">
                  📢 {closedNotice}
                </p>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#FFCCC7] text-xs font-bold text-[#A63434] flex items-center gap-1.5 shrink-0 shadow-2xs">
              <Ban className="w-4 h-4 text-[#CF1322]" />
              <span>本店鋪下單與代購功能已關閉</span>
            </div>
          </div>

          <p className="text-xs text-[#8C3636] sm:pl-15.5 font-medium leading-relaxed">
            ※ 本店鋪目前暫停接單與代購服務，商品與規格款式僅供江湖俠士瀏覽鑑賞。若需選購其他商品，請切換至上方其他營業中店鋪！
          </p>
        </div>
      )}

      {/* === STEP 2: 商品種類按鈕選單 (Product Category Selection) === */}
      {currentShop && currentShop.subCategories.length > 0 && (
        <div className="space-y-3 p-5 rounded-2xl bg-white border border-[#DDD5C7] shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-[#1E2530] flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#223147] text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              第二步：請選擇【商品種類】
            </label>
            <span className="text-xs text-[#6B7280]">
              目前店鋪：<strong className="text-[#C5922E]">{currentShop.name}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentShop.subCategories.map((subCat) => {
              const isSelected = subCat.id === selectedCategoryId;
              return (
                <button
                  key={subCat.id}
                  id={`btn-category-${subCat.id}`}
                  onClick={() => {
                    setSelectedCategoryId(subCat.id);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5922E] text-white border-[#C5922E] shadow-xs'
                      : 'bg-[#FAF7F2] text-[#4A5568] border-[#DDD5C7] hover:border-[#C5922E] hover:text-[#1E2530]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 opacity-80" />
                  <span>{subCat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === PRODUCT DETAILS & SPECIFICATIONS (All Products in Category) === */}
      {matchingProducts.length > 0 ? (
        <div className="space-y-6">
          {/* Card: 商品說明與注意事項 */}
          <div className="p-6 rounded-2xl bg-white border border-[#DDD5C7] space-y-4 shadow-xs">
            {/* Top Box: ⓘ 商品說明 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#1E2530]">
                <div className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-center text-xs font-bold text-[#C5922E]">
                  i
                </div>
                <span>商品說明</span>
              </div>
              <div className="text-sm text-[#4A5568] pl-7 whitespace-pre-line leading-relaxed">
                {matchingProducts[0]?.description || '詳見dc'}
              </div>
            </div>

            {/* Disclaimer Notice Alert Box (紅色的警語移到商品說明下面) */}
            <div className="p-4 rounded-xl bg-[#FFF2F0] border border-[#FFCCC7] text-xs sm:text-sm text-[#CF1322] leading-relaxed shadow-2xs font-medium">
              {matchingProducts[0]?.disclaimerNotice ||
                '下面的價格都是台幣，以貼文時的匯率轉換計價方便參考，實際價格以收款時的匯率為準，以上價格皆不包含均攤、運費、集運費和賣貨便運費。'}
            </div>
          </div>

          {/* === STEP 3: 選擇規格與數量 === */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-[#1E2530] flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#223147] text-white text-xs flex items-center justify-center font-bold">
                  3
                </span>
                <span>選擇規格與數量</span>
              </h3>
              <span className="text-xs text-[#6B7280]">
                此種類共包含 <strong className="text-[#C5922E]">{matchingProducts.length}</strong> 款商品，可同時選取規格並一鍵結帳
              </span>
            </div>

            {/* List all products in this category */}
            {matchingProducts.map((prod, prodIdx) => (
              <div
                key={prod.id}
                className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-[#DDD5C7] shadow-xs"
              >
                {/* Product Title Banner if multiple products */}
                {matchingProducts.length > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DDD5C7]">
                    <div className="flex items-center gap-3">
                      {prod.coverImage && (
                        <img
                          src={prod.coverImage}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-[#DDD5C7] shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#223147] text-[#E2B755] text-[11px] font-bold">
                            商品 {prodIdx + 1}
                          </span>
                          <h4 className="text-base sm:text-lg font-black text-[#1E2530]">
                            {prod.name}
                          </h4>
                        </div>
                        {prod.description && prod.description !== matchingProducts[0]?.description && (
                          <p className="text-xs text-[#6B7280] mt-0.5">{prod.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Spec notice for this specific product */}
                    {prod.specNotice && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFF2F0] border border-[#FFCCC7] text-xs font-extrabold text-[#CF1322] shadow-2xs shrink-0 self-start sm:self-auto">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#CF1322]" />
                        <span>
                          {prod.specNotice.startsWith('【') ? prod.specNotice : `【${prod.specNotice}】`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Single Product Spec Notice (when only 1 product) */}
                {matchingProducts.length === 1 && prod.specNotice && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFF2F0] border border-[#FFCCC7] text-xs font-extrabold text-[#CF1322] shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#CF1322]" />
                    <span>
                      {prod.specNotice.startsWith('【') ? prod.specNotice : `【${prod.specNotice}】`}
                    </span>
                  </div>
                )}

                {/* Spec Groups for this Product */}
                {prod.specGroups.map((group) => (
                  <div key={group.id} className="space-y-3">
                    {/* Spec group title */}
                    <div className="flex items-center gap-3 pt-1">
                      <h5 className="font-extrabold text-sm sm:text-base text-[#1E2530] flex items-center gap-2">
                        <span>{group.title}</span>
                        {group.notice && (
                          <span className="text-xs font-bold text-[#CF1322] bg-[#FFF2F0] border border-[#FFCCC7] px-2 py-0.5 rounded-lg">
                            {group.notice.startsWith('【') ? group.notice : `【${group.notice}】`}
                          </span>
                        )}
                      </h5>
                      <div className="flex-1 border-t border-[#DDD5C7]" />
                    </div>

                    {/* Spec Options Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {group.options.map((opt) => {
                        const count = specQuantities[opt.id] || 0;
                        const priceTwd = opt.priceTwd 
                          ? opt.priceTwd 
                          : proxyStore.calculateTwd(prod.basePriceRmb + (opt.priceOffsetRmb || 0));
                        
                        const isSoldOut = opt.inStock === false || (opt.statusNote && (opt.statusNote.includes('完售') || opt.statusNote.includes('售罄')));
                        const isCardDisabled = isSoldOut || isCurrentShopClosed;

                        return (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 bg-white shadow-xs ${
                              isCardDisabled
                                ? 'bg-[#FAF7F2]/60 border-[#DDD5C7]'
                                : count > 0
                                ? 'border-[#C5922E] ring-2 ring-[#C5922E]/20 bg-[#FAF7F2]'
                                : 'border-[#DDD5C7] hover:border-[#C5922E]'
                            }`}
                          >
                            {/* Left: Thumbnail & Name & Price */}
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Image preview */}
                              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] overflow-hidden shrink-0 relative">
                                <img
                                  src={opt.image || prod.coverImage}
                                  alt={opt.name}
                                  referrerPolicy="no-referrer"
                                  className={`w-full h-full object-cover ${isCardDisabled ? 'grayscale-40 opacity-70' : ''}`}
                                />
                                {isCurrentShopClosed ? (
                                  <div className="absolute inset-0 bg-[#A63434]/70 flex items-center justify-center text-[10px] font-extrabold text-white text-center px-1">
                                    閉店
                                  </div>
                                ) : isSoldOut ? (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] font-extrabold text-white">
                                    完售
                                  </div>
                                ) : null}
                              </div>

                              {/* Info */}
                              <div className="min-w-0 space-y-0.5">
                                <div className="font-extrabold text-sm text-[#1E2530] truncate flex items-center gap-1">
                                  <span>{opt.name}</span>
                                </div>

                                {/* Status note */}
                                {isCurrentShopClosed ? (
                                  <div className="text-[11px] font-bold text-[#CF1322] leading-tight">
                                    【手慢則無，俠士下次請早】
                                  </div>
                                ) : opt.statusNote ? (
                                  <div className="text-[11px] font-bold text-[#CF1322] leading-tight">
                                    {opt.statusNote.startsWith('【') ? opt.statusNote : `【${opt.statusNote}】`}
                                  </div>
                                ) : null}

                                <div className="text-xs font-bold text-[#A63434]">
                                  ${priceTwd}
                                </div>
                              </div>
                            </div>

                            {/* Right: Counter Stepper */}
                            <div className="flex items-center gap-1 shrink-0 bg-[#FAF7F2] border border-[#DDD5C7] rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => handleDecreaseQty(opt.id)}
                                disabled={count === 0 || isCardDisabled}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                                  count > 0 && !isCardDisabled
                                    ? 'bg-white hover:bg-[#EDE7DC] text-[#1E2530] border border-[#DDD5C7]'
                                    : 'text-gray-300 cursor-not-allowed'
                                }`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <span className={`w-8 text-center font-extrabold text-xs ${isCardDisabled ? 'text-[#A63434]' : 'text-[#1E2530]'}`}>
                                {isCardDisabled ? 0 : count}
                              </span>

                              <button
                                type="button"
                                onClick={() => !isCardDisabled && handleIncreaseQty(opt.id)}
                                disabled={isCardDisabled}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                                  isCardDisabled
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                    : 'bg-white hover:bg-[#EDE7DC] text-[#1E2530] border border-[#DDD5C7] cursor-pointer'
                                }`}
                                title={
                                  isCurrentShopClosed
                                    ? '手慢則無，俠士下次請早（已閉店）'
                                    : isSoldOut
                                    ? '已完售無法加購'
                                    : '增加數量'
                                }
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#DDD5C7] space-y-2">
          <p className="text-sm font-bold text-[#1E2530]">此種類目前尚無商品</p>
          <p className="text-xs text-[#6B7280]">請點擊右下角鎖頭進入後台「商品管理」新增商品與規格。</p>
        </div>
      )}

      {/* === BOTTOM FLOATING SUMMARY & CHECKOUT BAR === */}
      {selectedSummary.totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 bg-[#223147] text-white p-4 sm:p-5 rounded-2xl border border-[#C5922E] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5922E] text-white flex items-center justify-center font-extrabold text-base shrink-0">
              {selectedSummary.totalCount}
            </div>
            <div>
              <div className="text-xs text-gray-300">
                已選 <strong className="text-[#E2B755] font-extrabold">{selectedSummary.items.length}</strong> 項規格款式，共 <strong className="text-[#E2B755] font-extrabold">{selectedSummary.totalCount}</strong> 件
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white">
                合計: <span className="text-[#E2B755]">NT$ {selectedSummary.totalTwd}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleAddBatchToCart}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#223147] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-[#C5922E]" />
              <span>加入代購單</span>
            </button>

            <button
              onClick={handleBatchInstantCheckout}
              className="px-5 py-2.5 rounded-xl bg-[#C5922E] hover:bg-[#B38022] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>直接填單結帳</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
