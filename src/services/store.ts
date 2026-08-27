import { Order, ProductItem, Category, SubCategory, ProxyRateConfig, OrderStatus, FinancialTransaction } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_TRANSACTIONS, DEFAULT_RATE_CONFIG } from '../data/initialData';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

const STORAGE_KEYS = {
  ORDERS: 'xsj_proxy_orders_v1',
  PRODUCTS: 'xsj_proxy_products_v1',
  CATEGORIES: 'xsj_proxy_categories_v1',
  RATE_CONFIG: 'xsj_proxy_rate_config_v1',
  ADMIN_AUTH: 'xsj_proxy_admin_auth_v1',
  TRANSACTIONS: 'xsj_proxy_transactions_v1',
  LAST_SYNC: 'xsj_proxy_last_cloud_sync_v1',
};

export interface AdminUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isDevBypass?: boolean;
}

/**
 * Strips all `undefined` values recursively and guards against Firestore 1MB document size limit.
 */
function sanitizeForFirestore<T>(data: T): T {
  const cleaned = JSON.parse(JSON.stringify(data));
  const jsonStr = JSON.stringify(cleaned);
  if (jsonStr.length > 900000 && cleaned && typeof cleaned === 'object') {
    console.warn('⚠️ Document exceeds 900KB, stripping oversized option images to fit Firestore 1MB limit...');
    if ('options' in (cleaned as any) && Array.isArray((cleaned as any).options)) {
      (cleaned as any).options = (cleaned as any).options.map((opt: any) => ({
        ...opt,
        image: (opt.image && opt.image.length > 50000) ? '' : opt.image
      }));
    }
    if ('specGroups' in (cleaned as any) && Array.isArray((cleaned as any).specGroups)) {
      (cleaned as any).specGroups = (cleaned as any).specGroups.map((group: any) => ({
        ...group,
        options: Array.isArray(group.options) ? group.options.map((opt: any) => ({
          ...opt,
          image: (opt.image && opt.image.length > 50000) ? '' : opt.image
        })) : []
      }));
    }
  }
  return cleaned;
}

// Unified Store syncing between Local Cache & Firebase Firestore in Real-Time
class ProxyStoreService {
  private orders: Order[] = [];
  private products: ProductItem[] = [];
  private categories: Category[] = [];
  private transactions: FinancialTransaction[] = [];
  private rateConfig: ProxyRateConfig = DEFAULT_RATE_CONFIG;
  private currentAdmin: AdminUser | null = null;
  private listeners: (() => void)[] = [];
  private isFirebaseConnected: boolean = false;
  private syncError: string | null = null;
  private lastSyncTime: string | null = null;
  private hasInitializedCloud: boolean = false;

  constructor() {
    this.initLocal();
    this.initFirebaseSync();
  }

  private initLocal() {
    try {
      // Load Orders from cache
      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) {
        this.orders = JSON.parse(savedOrders);
      } else {
        this.orders = [...INITIAL_ORDERS];
      }

      // Load Products from cache
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        this.products = JSON.parse(savedProducts);
      } else {
        this.products = [...INITIAL_PRODUCTS];
      }

      // Load Categories from cache
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCategories) {
        this.categories = JSON.parse(savedCategories);
      } else {
        this.categories = [...INITIAL_CATEGORIES];
      }

      // Load Transactions from cache
      const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTransactions) {
        this.transactions = JSON.parse(savedTransactions);
      } else {
        this.transactions = [...INITIAL_TRANSACTIONS];
      }

      // Load Rate Config from cache
      const savedRates = localStorage.getItem(STORAGE_KEYS.RATE_CONFIG);
      if (savedRates) {
        this.rateConfig = JSON.parse(savedRates);
      }

      // Load Admin Auth
      const savedAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      if (savedAuth) {
        this.currentAdmin = JSON.parse(savedAuth);
      }

      this.lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (err) {
      console.warn('Local cache load fallback:', err);
      this.orders = [...INITIAL_ORDERS];
      this.products = [...INITIAL_PRODUCTS];
      this.categories = [...INITIAL_CATEGORIES];
      this.transactions = [...INITIAL_TRANSACTIONS];
    }
  }

  /**
   * Real-time sync with Firebase Cloud Firestore
   */
  private async initFirebaseSync() {
    if (!db) {
      console.log('Firebase DB not initialized, continuing in Local Storage mode.');
      return;
    }

    try {
      console.log('🔌 Connecting to Firebase Firestore real-time streams...');

      // 1. Subscribe to Categories
      const categoriesCol = collection(db, 'categories');
      onSnapshot(categoriesCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudCategories: Category[] = [];
          snapshot.forEach((docSnap) => {
            cloudCategories.push(docSnap.data() as Category);
          });
          const catMap = new Map<string, Category>();
          this.categories.forEach((c) => catMap.set(c.id, c));
          cloudCategories.forEach((cc) => catMap.set(cc.id, cc));
          this.categories = Array.from(catMap.values());
          this.saveCategoriesLocal();
          this.isFirebaseConnected = true;
          this.notify();
        }
      }, (err) => console.warn('Firestore Categories sync error:', err.message));

      // 2. Subscribe to Products
      const productsCol = collection(db, 'products');
      onSnapshot(productsCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudProducts: ProductItem[] = [];
          snapshot.forEach((docSnap) => {
            cloudProducts.push(docSnap.data() as ProductItem);
          });
          const productMap = new Map<string, ProductItem>();
          this.products.forEach((p) => productMap.set(p.id, p));
          cloudProducts.forEach((cp) => productMap.set(cp.id, cp));
          this.products = Array.from(productMap.values());
          this.saveProductsLocal();
          this.isFirebaseConnected = true;
          this.notify();
        }
      }, (err) => console.warn('Firestore Products sync error:', err.message));

      // 3. Subscribe to Orders
      const ordersCol = collection(db, 'orders');
      onSnapshot(ordersCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            cloudOrders.push(docSnap.data() as Order);
          });
          const orderMap = new Map<string, Order>();
          this.orders.forEach((o) => orderMap.set(o.id, o));
          cloudOrders.forEach((co) => orderMap.set(co.id, co));
          const mergedOrders = Array.from(orderMap.values());
          mergedOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          this.orders = mergedOrders;
          this.saveOrdersLocal();
          this.isFirebaseConnected = true;
          this.syncError = null;
          this.recordSyncSuccess();
          this.notify();
        }
      }, (err) => {
        console.warn('Firestore Orders sync error:', err.message);
        this.syncError = err.message;
        this.notify();
      });

      // 4. Subscribe to Transactions
      const txnsCol = collection(db, 'transactions');
      onSnapshot(txnsCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudTxns: FinancialTransaction[] = [];
          snapshot.forEach((docSnap) => {
            cloudTxns.push(docSnap.data() as FinancialTransaction);
          });
          const txnMap = new Map<string, FinancialTransaction>();
          this.transactions.forEach((t) => txnMap.set(t.id, t));
          cloudTxns.forEach((ct) => txnMap.set(ct.id, ct));
          const mergedTxns = Array.from(txnMap.values());
          mergedTxns.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          this.transactions = mergedTxns;
          this.saveTransactionsLocal();
          this.isFirebaseConnected = true;
          this.notify();
        }
      }, (err) => console.warn('Firestore Transactions sync error:', err.message));

      // 5. Subscribe to Settings (Rate Config)
      const settingsCol = collection(db, 'settings');
      onSnapshot(settingsCol, (snapshot) => {
        snapshot.forEach((docSnap) => {
          if (docSnap.id === 'rate_config') {
            this.rateConfig = docSnap.data() as ProxyRateConfig;
            localStorage.setItem(STORAGE_KEYS.RATE_CONFIG, JSON.stringify(this.rateConfig));
            this.isFirebaseConnected = true;
            this.notify();
          }
        });
      }, (err) => console.warn('Firestore Settings sync error:', err.message));

    } catch (err: any) {
      console.warn('Firebase sync initialization fallback to local:', err?.message || err);
      this.syncError = err?.message || '連線失敗';
    }
  }

  private recordSyncSuccess() {
    const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.lastSyncTime = time;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, time);
    } catch {}
  }

  /**
   * Force sync all local data to Firebase Firestore (Push)
   */
  public async syncAllToFirebase(): Promise<{ success: boolean; message: string }> {
    if (!db) {
      return { success: false, message: 'Firebase 未完成初始化' };
    }

    try {
      console.log('🔄 開始同步全站資料至 Firebase Firestore...');

      // Attempt 1: Try batch write
      try {
        const batch = writeBatch(db);

        // Categories
        this.categories.forEach((cat) => {
          const ref = doc(db!, 'categories', cat.id);
          batch.set(ref, sanitizeForFirestore(cat));
        });

        // Products
        this.products.forEach((prod) => {
          const ref = doc(db!, 'products', prod.id);
          batch.set(ref, sanitizeForFirestore(prod));
        });

        // Orders
        this.orders.forEach((ord) => {
          const ref = doc(db!, 'orders', ord.id);
          batch.set(ref, sanitizeForFirestore(ord));
        });

        // Transactions
        this.transactions.forEach((txn) => {
          const ref = doc(db!, 'transactions', txn.id);
          batch.set(ref, sanitizeForFirestore(txn));
        });

        // Rate config
        const rateRef = doc(db, 'settings', 'rate_config');
        batch.set(rateRef, sanitizeForFirestore(this.rateConfig));

        await batch.commit();
      } catch (batchErr) {
        console.warn('Batch commit failed, falling back to parallel individual writes:', batchErr);
        // Fallback: Individual doc setDoc writes
        const writePromises: Promise<any>[] = [];
        this.categories.forEach((cat) => {
          writePromises.push(setDoc(doc(db!, 'categories', cat.id), sanitizeForFirestore(cat)));
        });
        this.products.forEach((prod) => {
          writePromises.push(setDoc(doc(db!, 'products', prod.id), sanitizeForFirestore(prod)));
        });
        this.orders.forEach((ord) => {
          writePromises.push(setDoc(doc(db!, 'orders', ord.id), sanitizeForFirestore(ord)));
        });
        this.transactions.forEach((txn) => {
          writePromises.push(setDoc(doc(db!, 'transactions', txn.id), sanitizeForFirestore(txn)));
        });
        writePromises.push(setDoc(doc(db, 'settings', 'rate_config'), sanitizeForFirestore(this.rateConfig)));

        await Promise.all(writePromises);
      }

      this.isFirebaseConnected = true;
      this.syncError = null;
      this.recordSyncSuccess();
      this.notify();
      console.log('✅ 全站資料已成功同步儲存至 Firebase Firestore！');
      return { success: true, message: `已成功將 ${this.products.length} 項商品、${this.orders.length} 筆訂單同步至 Firebase 雲端！` };
    } catch (err: any) {
      console.error('Firebase syncAll error:', err);
      this.syncError = err?.message || '同步寫入失敗';
      this.notify();
      return { success: false, message: `同步失敗: ${err?.message || '未知錯誤'}` };
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getIsCloudConnected(): boolean {
    return this.isFirebaseConnected;
  }

  public getSyncStatus(): { isConnected: boolean; lastSyncTime: string | null; error: string | null } {
    return {
      isConnected: this.isFirebaseConnected,
      lastSyncTime: this.lastSyncTime,
      error: this.syncError,
    };
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id.toLowerCase() === id.toLowerCase() || o.queryCode.toLowerCase() === id.toLowerCase());
  }

  public searchOrders(query: string): Order[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.queryCode.toLowerCase().includes(q) ||
        o.buyerNickname.toLowerCase().includes(q) ||
        o.contactValue.toLowerCase().includes(q)
    );
  }

  public createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Order {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = dateStr.replace(/-/g, '').slice(0, 6);
    const generatedId = order.id || `XSJ-${datePrefix}-${randSuffix}`;
    const generatedQueryCode = order.queryCode || `Q${randSuffix}`;

    const newOrder: Order = {
      ...order,
      id: generatedId,
      queryCode: generatedQueryCode,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Update Local
    this.orders.unshift(newOrder);
    this.saveOrdersLocal();

    // Auto record revenue transaction
    let channel = '地攤';
    const firstItemName = newOrder.items[0]?.productName || '';
    if (firstItemName.includes('設定集') || firstItemName.includes('小餅') || firstItemName.includes('官方世界觀')) {
      channel = '小餅';
    } else if (firstItemName.includes('客製') || firstItemName.includes('自選')) {
      channel = '手動';
    }

    const itemsSummary = newOrder.items.map((i) => `${i.productName} x${i.quantity}`).join('、');
    const paymentMethodDisplay = 
      newOrder.shippingMethod === 'meetup' ? '現金 / 面交' : '銀行轉帳';

    const newTxn: FinancialTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      type: 'revenue',
      title: itemsSummary || `訂單代購營收 (${newOrder.id})`,
      amountTwd: newOrder.totalTwd,
      amountRmb: newOrder.totalRmb,
      channelOrCategory: channel,
      date: dateStr,
      time: timeStr,
      orderId: generatedId,
      buyerOrPayee: newOrder.buyerNickname,
      note: `買家下單自動入帳。共 ${newOrder.items.length} 項品項，運送方式: ${newOrder.shippingMethod}`,
      paymentMethod: paymentMethodDisplay,
      createdAt: timestamp,
    };

    this.transactions = [newTxn, ...this.transactions];
    this.saveTransactionsLocal();
    this.notify();

    // Cloud Sync to Firestore with Sanitizer
    if (db) {
      setDoc(doc(db, 'orders', newOrder.id), sanitizeForFirestore(newOrder))
        .then(() => {
          this.isFirebaseConnected = true;
          this.recordSyncSuccess();
        })
        .catch((e) => console.warn('Cloud save order error:', e));

      setDoc(doc(db, 'transactions', newTxn.id), sanitizeForFirestore(newTxn))
        .catch((e) => console.warn('Cloud save txn error:', e));
    }

    return newOrder;
  }

  public updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    patch?: Partial<Order>
  ): Order | null {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const existing = this.orders[index];

    let newPaymentStatus = existing.paymentStatus;
    if (status === 'payment_received' && existing.paymentStatus === 'unpaid') {
      newPaymentStatus = 'deposit_paid';
    } else if (status === 'completed' || status === 'shipped') {
      newPaymentStatus = 'fully_paid';
    }

    const updated: Order = {
      ...existing,
      ...patch,
      status,
      paymentStatus: patch?.paymentStatus || newPaymentStatus,
      updatedAt: timestamp,
    };

    this.orders[index] = updated;
    this.saveOrdersLocal();
    this.notify();

    if (db) {
      setDoc(doc(db, 'orders', updated.id), sanitizeForFirestore(updated))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud update order status error:', e));
    }

    return updated;
  }

  public updateOrder(orderId: string, updates: Partial<Order>): Order | null {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updated: Order = {
      ...this.orders[index],
      ...updates,
      updatedAt: timestamp,
    };

    this.orders[index] = updated;
    this.saveOrdersLocal();
    this.notify();

    if (db) {
      setDoc(doc(db, 'orders', updated.id), sanitizeForFirestore(updated))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud update order error:', e));
    }

    return updated;
  }

  public deleteOrder(orderId: string): boolean {
    const initialLen = this.orders.length;
    this.orders = this.orders.filter((o) => o.id !== orderId);
    if (this.orders.length !== initialLen) {
      this.saveOrdersLocal();
      this.notify();
      if (db) {
        deleteDoc(doc(db, 'orders', orderId))
          .then(() => this.recordSyncSuccess())
          .catch((e) => console.warn('Cloud delete order error:', e));
      }
      return true;
    }
    return false;
  }

  private saveOrdersLocal() {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }

  // --- Products & Categories ---
  public getProducts(): ProductItem[] {
    return [...this.products];
  }

  public getCategories(): Category[] {
    return [...this.categories];
  }

  public getCategoryById(id: string): Category | undefined {
    return this.categories.find((c) => c.id === id);
  }

  public saveCategory(category: Category): void {
    const index = this.categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      this.categories[index] = category;
    } else {
      this.categories.push(category);
    }
    this.saveCategoriesLocal();
    this.notify();

    if (db) {
      setDoc(doc(db, 'categories', category.id), sanitizeForFirestore(category))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud save category error:', e));
    }
  }

  public toggleShopClosed(shopId: string, isClosed?: boolean, customNotice?: string): Category | null {
    const cat = this.categories.find((c) => c.id === shopId);
    if (!cat) return null;
    cat.isClosed = isClosed !== undefined ? isClosed : !cat.isClosed;
    if (customNotice !== undefined) {
      cat.closedNotice = customNotice;
    } else if (!cat.closedNotice) {
      cat.closedNotice = '手慢則無，俠士下次請早';
    }
    this.saveCategoriesLocal();
    this.notify();

    if (db) {
      setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud toggle closed error:', e));
    }
    return cat;
  }

  public deleteCategory(categoryId: string): void {
    this.categories = this.categories.filter((c) => c.id !== categoryId);
    this.saveCategoriesLocal();
    this.notify();

    if (db) {
      deleteDoc(doc(db, 'categories', categoryId))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud delete category error:', e));
    }
  }

  public addSubCategory(categoryId: string, subCategory: SubCategory): void {
    const cat = this.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const exists = cat.subCategories.find((s) => s.id === subCategory.id);
    if (!exists) {
      cat.subCategories.push(subCategory);
      this.saveCategoriesLocal();
      this.notify();
      if (db) {
        setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat))
          .then(() => this.recordSyncSuccess())
          .catch((e) => console.warn('Cloud add subcategory error:', e));
      }
    }
  }

  public updateSubCategory(categoryId: string, subCategory: SubCategory): void {
    const cat = this.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const index = cat.subCategories.findIndex((s) => s.id === subCategory.id);
    if (index >= 0) {
      cat.subCategories[index] = subCategory;

      // Auto propagate subcategory description to all products belonging to this category
      if (subCategory.description !== undefined) {
        let hasProductChanges = false;
        this.products.forEach((p) => {
          if (p.categoryId === categoryId && p.subCategoryId === subCategory.id) {
            p.description = subCategory.description || '';
            hasProductChanges = true;
            if (db) {
              setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p))
                .catch((e) => console.warn('Cloud sync product desc error:', e));
            }
          }
        });
        if (hasProductChanges) {
          this.saveProductsLocal();
        }
      }

      this.saveCategoriesLocal();
      this.notify();
      if (db) {
        setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat))
          .then(() => this.recordSyncSuccess())
          .catch((e) => console.warn('Cloud update subcategory error:', e));
      }
    }
  }

  public deleteSubCategory(categoryId: string, subCategoryId: string): void {
    const cat = this.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    cat.subCategories = cat.subCategories.filter((s) => s.id !== subCategoryId);
    this.saveCategoriesLocal();
    this.notify();
    if (db) {
      setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud delete subcategory error:', e));
    }
  }

  public getProductsByCategory(categoryId: string, subCategoryId?: string): ProductItem[] {
    return this.products.filter((p) => {
      if (p.categoryId !== categoryId) return false;
      if (subCategoryId && p.subCategoryId !== subCategoryId) return false;
      return true;
    });
  }

  public saveProduct(product: ProductItem): void {
    const index = this.products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      this.products[index] = product;
    } else {
      this.products.unshift(product);
    }
    this.saveProductsLocal();
    this.notify();

    if (db) {
      setDoc(doc(db, 'products', product.id), sanitizeForFirestore(product))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud save product error:', e));
    }
  }

  public deleteProduct(productId: string): void {
    this.products = this.products.filter((p) => p.id !== productId);
    this.saveProductsLocal();
    this.notify();

    if (db) {
      deleteDoc(doc(db, 'products', productId))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud delete product error:', e));
    }
  }

  private saveProductsLocal() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    } catch (e) {
      console.error('Failed to save products', e);
    }
  }

  private saveCategoriesLocal() {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }

  // --- Rate Config ---
  public getRateConfig(): ProxyRateConfig {
    return { ...this.rateConfig };
  }

  public updateRateConfig(newConfig: Partial<ProxyRateConfig>) {
    this.rateConfig = { ...this.rateConfig, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEYS.RATE_CONFIG, JSON.stringify(this.rateConfig));
    } catch (e) {
      console.error('Failed to save rate config', e);
    }
    this.notify();

    if (db) {
      setDoc(doc(db, 'settings', 'rate_config'), sanitizeForFirestore(this.rateConfig))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud rate config error:', e));
    }
  }

  public calculateTwd(rmbPrice: number): number {
    const { exchangeRate, serviceFeePercent } = this.rateConfig;
    const base = rmbPrice * exchangeRate;
    const withFee = base * (1 + serviceFeePercent / 100);
    return Math.ceil(withFee);
  }

  // --- Admin Auth ---
  public getAdminUser(): AdminUser | null {
    return this.currentAdmin;
  }

  public setAdminUser(user: AdminUser | null) {
    this.currentAdmin = user;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
    this.notify();
  }

  public devBypassLogin(displayName = '西山居代購掌門 (管理員)') {
    const devUser: AdminUser = {
      uid: 'admin-dev-bypass-001',
      displayName,
      email: 'admin@seasun-proxy.internal',
      isDevBypass: true,
    };
    this.setAdminUser(devUser);
    return devUser;
  }

  // --- Financial Transactions (Cash Flow 流水帳) ---
  public getTransactions(): FinancialTransaction[] {
    return [...this.transactions];
  }

  public addTransaction(txnData: Omit<FinancialTransaction, 'id' | 'createdAt'>): FinancialTransaction {
    const newTxn: FinancialTransaction = {
      ...txnData,
      id: `TXN-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    this.transactions = [newTxn, ...this.transactions];
    this.saveTransactionsLocal();
    this.notify();

    if (db) {
      setDoc(doc(db, 'transactions', newTxn.id), sanitizeForFirestore(newTxn))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud save txn error:', e));
    }

    return newTxn;
  }

  public updateTransaction(id: string, updates: Partial<FinancialTransaction>): boolean {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.transactions[index] = { ...this.transactions[index], ...updates };
    this.saveTransactionsLocal();
    this.notify();

    if (db) {
      setDoc(doc(db, 'transactions', id), sanitizeForFirestore(this.transactions[index]))
        .then(() => this.recordSyncSuccess())
        .catch((e) => console.warn('Cloud update txn error:', e));
    }
    return true;
  }

  public deleteTransaction(id: string): boolean {
    const prevLen = this.transactions.length;
    this.transactions = this.transactions.filter((t) => t.id !== id);
    if (this.transactions.length !== prevLen) {
      this.saveTransactionsLocal();
      this.notify();
      if (db) {
        deleteDoc(doc(db, 'transactions', id))
          .then(() => this.recordSyncSuccess())
          .catch((e) => console.warn('Cloud delete txn error:', e));
      }
      return true;
    }
    return false;
  }

  private saveTransactionsLocal() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
    } catch (e) {
      console.error('Failed to save transactions', e);
    }
  }

  public resetToSampleData() {
    this.orders = [...INITIAL_ORDERS];
    this.products = [...INITIAL_PRODUCTS];
    this.categories = [...INITIAL_CATEGORIES];
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.rateConfig = DEFAULT_RATE_CONFIG;
    this.saveOrdersLocal();
    this.saveProductsLocal();
    this.saveCategoriesLocal();
    this.saveTransactionsLocal();
    this.notify();
    if (db) {
      this.syncAllToFirebase();
    }
  }

  public async clearAllData() {
    this.orders = [];
    this.products = [];
    this.categories = [];
    this.transactions = [];
    this.saveOrdersLocal();
    this.saveProductsLocal();
    this.saveCategoriesLocal();
    this.saveTransactionsLocal();
    this.notify();

    if (db) {
      try {
        console.log('🗑️ 正在從 Firebase 雲端徹底刪除所有資料...');
        const collectionsToClear = ['products', 'categories', 'orders', 'transactions'];
        for (const colName of collectionsToClear) {
          const snap = await getDocs(collection(db, colName));
          const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
          await Promise.all(deletePromises);
        }
        console.log('✅ Firebase 雲端資料已全部清空！');
      } catch (e) {
        console.warn('Error clearing Firestore docs:', e);
      }
    }
  }
}

export const proxyStore = new ProxyStoreService();
