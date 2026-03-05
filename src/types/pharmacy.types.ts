// ── Drug Catalog ──

export interface DrugCategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  image_url?: string;
  drug_count?: number;
}

export interface Drug {
  _id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  brand_names?: string[];
  strength: string;
  dosage_form?: string | {_id: string; name: string};
  dosage_form_id?: string;
  route?: string | {_id: string; name: string};
  route_abbreviation?: string;
  categories?: (string | DrugCategory)[];
  classification?: string | {_id: string; name: string};
  manufacturer?: string;
  description?: string;
  short_description?: string;
  active_ingredients?: string[];
  // Price fields — API returns selling_price/display_price from search, price from detail
  price?: number;
  selling_price?: number;
  display_price?: number;
  display_currency?: string;
  cost_price?: number;
  prices?: Record<string, {cost_price?: number; selling_price?: number} | number>;
  quantity?: number;
  quantity_in_stock?: number;
  requires_prescription: boolean;
  is_otc?: boolean;
  is_featured?: boolean;
  is_controlled?: boolean;
  purchase_type?: PurchaseType;
  schedule?: string;
  schedule_class?: string;
  images?: {url: string; alt?: string}[];
  image_url?: string | null;
  primary_image?: string | null;
  side_effects?: string[];
  contraindications?: string[];
  warnings?: string[];
  interactions?: string[];
  storage_conditions?: string;
  pregnancy_category?: string;
  max_quantity_per_order?: number;
  is_active?: boolean;
  is_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PurchaseType =
  | 'OTC_GENERAL'
  | 'OTC_RESTRICTED'
  | 'PHARMACY_ONLY'
  | 'PRESCRIPTION_ONLY'
  | 'CONTROLLED';

// ── Cart ──

export interface CartItem {
  drugId: string;
  name: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  requiresPrescription: boolean;
  maxQuantityPerOrder: number;
}

// ── Orders ──

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type DeliveryMethod = 'PICKUP' | 'DELIVERY';

export interface OrderItem {
  drug?: string | Drug;
  drug_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  requires_prescription: boolean;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface PharmacyOrder {
  _id: string;
  order_number: string;
  patient: string | Record<string, any>;
  pharmacy: string | Record<string, any>;
  order_type: 'OTC' | 'PRESCRIPTION' | 'GENERAL';
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  payment_reference?: string;
  delivery_method: DeliveryMethod;
  delivery_address?: DeliveryAddress;
  estimated_delivery_date?: string;
  delivery_tracking_number?: string;
  pickup_code?: string;
  status_history: OrderStatusHistoryEntry[];
  rating?: number;
  review?: string;
  confirmation_pdf_url?: string;
  patient_notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Addresses ──

export interface DeliveryAddress {
  _id?: string;
  label: string;
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country?: string;
  postal_code?: string;
  additional_info?: string;
  is_default?: boolean;
}

// ── Helpers ──

/** Resolve the best price from whichever field the API populated */
export function getDrugPrice(drug: Drug): number {
  return drug.display_price || drug.selling_price || drug.price || 0;
}

/** Resolve the best image URL from whichever field the API populated */
export function getDrugImage(drug: Drug): string | null {
  return drug.primary_image || drug.image_url || null;
}

// ── Search Params ──

export interface DrugSearchParams {
  query?: string;
  category?: string;
  purchase_type?: PurchaseType;
  manufacturer?: string;
  is_otc?: boolean;
  requires_prescription?: boolean;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
