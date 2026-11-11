export type CustomerTier = 'Supermarket' | 'WholesaleClub' | 'IndependentGrocer' | 'Institutional';
export type CreditRating = 'AAA' | 'AA' | 'A' | 'BBB';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'JPY';
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'zh';

export interface BulkPriceTier {
  minQty: number;
  maxQty?: number;
  discountPct: number; // e.g. 15 for 15% off
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'Produce' | 'Dairy & Chilled' | 'Dry Goods & Pantry' | 'Beverages' | 'Bakery' | 'Packaging & Bulk';
  basePrice: number;
  unit: string; // e.g., 'Case of 24', '40 lb Crate', 'Pallet (48 cases)'
  stock: number;
  minStockThreshold: number;
  reorderQuantity: number;
  barcode: string;
  weightKg: number;
  bulkTiers: BulkPriceTier[];
  isOrganic?: boolean;
  temperatureZone: 'Ambient' | 'Chilled (2-4°C)' | 'Frozen (-18°C)';
  supplier: string;
  imageUrl?: string;
  tags: string[];
}

export interface CreditAccount {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  customerTier: CustomerTier;
  creditRating: CreditRating;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 60';
  overdueBalance: number;
  autoReorderEnabled: boolean;
  discountRatePct: number; // based on rating & tier
}

export interface PosTerminal {
  id: string;
  name: string;
  location: string;
  type: 'Checkout Lane' | 'Self-Checkout Kiosk' | 'Smart Cart Unit' | 'Handheld Mobile';
  status: 'online' | 'busy' | 'offline';
  ipAddress: string;
  lastSync: string;
  currentCashier?: string;
}

export interface RobotUnit {
  id: string;
  name: string;
  type: 'AGV' | 'Robotic Arm' | 'Customer Box Packer' | 'Truck Loader';
  zone: 'Aisle A-Pallets' | 'Sorting Hub B' | 'Dock 4 Loading' | 'Packing Station 1' | 'Customer Help Bay';
  battery: number;
  status: 'active' | 'idle' | 'charging' | 'maintenance';
  currentTask: string;
  x: number; // 0 to 100 on warehouse map
  y: number; // 0 to 100 on warehouse map
  targetX?: number;
  targetY?: number;
  speedMps: number;
  payloadKg: number;
  maxPayloadKg: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  destination: string;
  client: string;
  itemCount: number;
  weightKg: number;
  status: 'Preparing' | 'Robotic Loading' | 'In Transit' | 'Delivered';
  eta: string;
  truckId: string;
  driverName: string;
  tempCelsius: number;
  tempStatus: 'Normal' | 'Alert';
  lat: number;
  lng: number;
}

export interface DemandForecast {
  sku: string;
  name: string;
  currentDemand: number;
  forecastNextWeek: number;
  confidencePct: number;
  weatherImpact: 'High' | 'Moderate' | 'Low';
  recommendedReorderDate: string;
  recommendedOrderQty: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountAppliedPct: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discountTotal: number;
  total: number;
  currency: CurrencyCode;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'ACH Transfer' | 'Account Credit (Net-30)';
  status: 'Pending' | 'Auto-Processed' | 'Robotic Picking' | 'Packed' | 'Shipped' | 'Completed';
  robotAssigned?: string;
  posTerminalId?: string;
}

export interface RecognizedItem {
  label: string;
  matchedSku?: string;
  confidence: number;
  estimatedWeightKg?: number;
  unitPrice?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
