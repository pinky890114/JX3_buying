export type OrderStatus = 
  | 'pending_payment'   // 待付款
  | 'payment_received'  // 已收款
  | 'procuring'         // 採購中
  | 'warehouse_in'      // 抵達大陸集運
  | 'shipping_intl'     // 國際轉運中
  | 'arrived_tw'        // 已抵達/分檢中
  | 'shipped'           // 已寄出
  | 'completed'         // 已完成
  | 'cancelled';        // 已取消

export interface SpecOption {
  id: string;
  name: string;
  priceOffsetRmb?: number; // 差價 (RMB)
  priceTwd?: number; // 直接指定台幣售價 (TWD)
  image?: string;
  inStock?: boolean;
  statusNote?: string; // 狀態備註，例如: "已完售，預計年末或明年初再販"
}

export interface SpecGroup {
  id: string;
  title: string; // 例如: 門派款式、門派貼紙、尺寸、特典配置
  notice?: string; // 規格群組備註/公告 (例如: "已完售，預計年末或明年初再販")
  options: SpecOption[];
}

export interface ProductItem {
  id: string;
  name: string;
  categoryId: string; // 店鋪 ID (Shop ID)
  subCategoryId: string; // 商品種類 ID (Product Category ID)
  basePriceRmb: number;
  calculatedPriceTwd?: number;
  depositRmb?: number;
  coverImage: string;
  images?: string[];
  description: string; // ⓘ 商品說明
  priceExplanation?: string; // $ 價格相關說明 (例如: 詳見dc)
  disclaimerNotice?: string; // 警語/匯率運費說明 (例如: 下面的價格都是台幣...)
  specNotice?: string; // 規格處備註/公告 (例如: "已完售，預計年末或明年初再販")
  specGroups: SpecGroup[];
  isPreorder?: boolean;
  preorderEstimate?: string;
  officialTag?: string; // e.g. "西山居官方旗艦店", "劍網3官方同人", "塵白禁區限定"
  salesNote?: string;
}

// 店鋪 (舊稱大分類)
export interface Category {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  description?: string;
  isClosed?: boolean; // 是否閉店 (暫停營業)
  closedNotice?: string; // 閉店公告 (預設: "手慢則無，俠士下次請早")
  subCategories: SubCategory[]; // 該店鋪底下的商品種類
}

// 商品種類 (舊稱品類 / 小分類)
export interface SubCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

// Aliases
export type Shop = Category;
export type ProductCategory = SubCategory;

export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  coverImage: string;
  selectedSpecs: { [groupId: string]: SpecOption };
  unitPriceRmb: number;
  unitPriceTwd: number;
  quantity: number;
  depositTwd: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  coverImage: string;
  selectedSpecsText: string;
  quantity: number;
  priceRmb: number;
  priceTwd: number;
  depositTwd: number;
}

export interface OrderTimelineItem {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  operator?: string;
}

export interface Order {
  id: string; // e.g. XSJ-202608-0101
  queryCode: string; // 查詢防偽碼或簡稱
  buyerNickname: string; // 買家暱稱
  contactMethod: 'line' | 'discord' | 'facebook' | 'phone' | 'email';
  contactValue: string; // 聯絡帳號
  shippingMethod: '7-11' | 'family_mart' | 'home_delivery' | 'meetup';
  shippingAddress: string; // 門市名稱與店號 / 地址
  items: OrderItem[];
  totalRmb: number;
  totalTwd: number;
  depositTwd: number;
  remainingTwd: number;
  shippingFeeTwd: number;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded';
  paymentAccountLast5?: string;
  paymentProofImage?: string;
  trackingNumber?: string;
  publicNotes: string; // 店主公開給買家看的進度備註
  adminNotes?: string; // 管理員內部備註
  explanationImages?: string[]; // 說明圖 / 採購截圖 / 實拍進度圖
  createdAt: string;
  updatedAt: string;
  estimatedArrival?: string;
}

export interface ProxyRateConfig {
  exchangeRate: number; // e.g. 4.65
  serviceFeePercent: number; // e.g. 5%
  intlShippingPerKgTwd: number; // e.g. 110 TWD / kg
  twDomesticShipping711: number; // 60 TWD
}

// 財務流水帳交易紀錄
export type TransactionType = 'revenue' | 'expense';

export interface FinancialTransaction {
  id: string;
  type: TransactionType; // 'revenue' (營收) | 'expense' (支出)
  title: string; // 項目名稱 / 描述
  amountTwd: number; // 金額 (TWD)
  amountRmb?: number; // 原幣金額 (RMB, 選填)
  channelOrCategory: string; // 營收渠道 (e.g. "地攤", "小餅", "手動") 或 支出分類 (e.g. "採購成本", "國際運費", "包材雜支")
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  orderId?: string; // 關聯訂單編號 (選填)
  buyerOrPayee?: string; // 買家暱稱 / 收款方
  note?: string; // 備註
  paymentMethod?: string; // 支付方式 (銀行轉帳、LINE Pay、現金、支付寶等)
  createdAt: string;
}
