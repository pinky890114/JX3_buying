import { Order, ProductItem, Category, SubCategory, ProxyRateConfig, OrderStatus, FinancialTransaction } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_TRANSACTIONS, DEFAULT_RATE_CONFIG } from '../data/initialData';

const STORAGE_KEYS = {
  ORDERS: 'xsj_proxy_orders_v1',
  PRODUCTS: 'xsj_proxy_products_v1',
  CATEGORIES: 'xsj_proxy_categories_v1',
  RATE_CONFIG: 'xsj_proxy_rate_config_v1',
  ADMIN_AUTH: 'xsj_proxy_admin_auth_v1',
  TRANSACTIONS: 'xsj_proxy_transactions_v1',
};

export interface AdminUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isDevBypass?: boolean;
}

// Memory & LocalStorage unified store with Firestore capability hooks
class ProxyStoreService {
  private orders: Order[] = [];
  private products: ProductItem[] = [];
  private categories: Category[] = [];
  private transactions: FinancialTransaction[] = [];
  private rateConfig: ProxyRateConfig = DEFAULT_RATE_CONFIG;
  private currentAdmin: AdminUser | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      // Load Orders
      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) {
        this.orders = JSON.parse(savedOrders);
      } else {
        this.orders = [...INITIAL_ORDERS];
        this.saveOrders();
      }

      // Load Products
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        this.products = JSON.parse(savedProducts);
      } else {
        this.products = [...INITIAL_PRODUCTS];
        this.saveProducts();
      }

      // Load Categories
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCategories) {
        this.categories = JSON.parse(savedCategories);
      } else {
        this.categories = [...INITIAL_CATEGORIES];
        this.saveCategories();
      }

      // Load Transactions (Financial Cash Flow)
      const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTransactions) {
        this.transactions = JSON.parse(savedTransactions);
      } else {
        this.transactions = [...INITIAL_TRANSACTIONS];
        this.saveTransactions();
      }

      // Load Rate Config
      const savedRates = localStorage.getItem(STORAGE_KEYS.RATE_CONFIG);
      if (savedRates) {
        this.rateConfig = JSON.parse(savedRates);
      }

      // Load Admin Auth state
      const savedAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      if (savedAuth) {
        this.currentAdmin = JSON.parse(savedAuth);
      }
    } catch (err) {
      console.warn('LocalStorage load error, using initial defaults', err);
      this.orders = [...INITIAL_ORDERS];
      this.products = [...INITIAL_PRODUCTS];
      this.categories = [...INITIAL_CATEGORIES];
      this.transactions = [...INITIAL_TRANSACTIONS];
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

    this.orders.unshift(newOrder);
    this.saveOrders();

    // 自動新增一筆營收收入流水帳 (Cash Flow Transaction)
    // 依據商品名稱或訂單來源識別渠道 (地攤 / 小餅 / 客製)
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
    this.saveTransactions();

    this.notify();
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
    this.saveOrders();
    this.notify();
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
    this.saveOrders();
    this.notify();
    return updated;
  }

  public deleteOrder(orderId: string): boolean {
    const initialLen = this.orders.length;
    this.orders = this.orders.filter((o) => o.id !== orderId);
    if (this.orders.length !== initialLen) {
      this.saveOrders();
      this.notify();
      return true;
    }
    return false;
  }

  private saveOrders() {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }

  // --- Products & Categories (店鋪與商品種類) ---
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
    this.saveCategories();
    this.notify();
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
    this.saveCategories();
    this.notify();
    return cat;
  }

  public deleteCategory(categoryId: string): void {
    this.categories = this.categories.filter((c) => c.id !== categoryId);
    // Also remove or reassign products under this category
    this.saveCategories();
    this.notify();
  }

  public addSubCategory(categoryId: string, subCategory: SubCategory): void {
    const cat = this.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const exists = cat.subCategories.find((s) => s.id === subCategory.id);
    if (!exists) {
      cat.subCategories.push(subCategory);
      this.saveCategories();
      this.notify();
    }
  }

  public updateSubCategory(categoryId: string, subCategory: SubCategory): void {
    const cat = this.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const index = cat.subCategories.findIndex((s) => s.id === subCategory.id);
    if (index >= 0) {
      cat.subCategories[index] = subCategory;
      this.saveCategories();
      this.notify();
    }
  }

  public deleteSubCategory(categoryId: string, subCategoryId: string): void {
    const cat = this.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    cat.subCategories = cat.subCategories.filter((s) => s.id !== subCategoryId);
    this.saveCategories();
    this.notify();
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
    this.saveProducts();
    this.notify();
  }

  public deleteProduct(productId: string): void {
    this.products = this.products.filter((p) => p.id !== productId);
    this.saveProducts();
    this.notify();
  }

  private saveProducts() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    } catch (e) {
      console.error('Failed to save products', e);
    }
  }

  private saveCategories() {
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
    this.saveTransactions();
    this.notify();
    return newTxn;
  }

  public updateTransaction(id: string, updates: Partial<FinancialTransaction>): boolean {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.transactions[index] = { ...this.transactions[index], ...updates };
    this.saveTransactions();
    this.notify();
    return true;
  }

  public deleteTransaction(id: string): boolean {
    const prevLen = this.transactions.length;
    this.transactions = this.transactions.filter((t) => t.id !== id);
    if (this.transactions.length !== prevLen) {
      this.saveTransactions();
      this.notify();
      return true;
    }
    return false;
  }

  private saveTransactions() {
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
    this.saveOrders();
    this.saveProducts();
    this.saveCategories();
    this.saveTransactions();
    this.notify();
  }
}

export const proxyStore = new ProxyStoreService();
