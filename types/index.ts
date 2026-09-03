export type Role = "admin" | "customer";

export interface Profile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  role: Role;
  notes?: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  image_url?: string;
  emoji?: string;            // opcjonalna emotka wyświetlana obok MG i ML
  gradient_colors?: string[]; // opcjonalne kolory gradientu jako tło kafelka
  nicotine_strength: string; // np. "20MG"
  volume_ml?: string;        // np. "10ML" lub "30ML"
  is_available: boolean;
  is_new?: boolean;          // nowość - żółta otoczka i na początku
  price?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  nicotine_strength?: string;
  brand?: string; // np. "Elfliq", "Vozol", "Puffy"
  volume_ml?: string;
}

// Zdarzenie statusu w historii zamówienia (styl InPost)
export interface OrderStatusHistoryItem {
  id: string;
  name: string;          // np. "Przyjęte", "Spakowane", "Wysłane"
  color?: string;        // np. "amber", "emerald", "blue", "purple", "rose"
  icon?: string;         // np. "Package", "Clock", "Truck", "CheckCircle", "ShoppingBag"
  date: string;          // data dodania statusu
  comment?: string;      // opcjonalna notatka do tego kroku
}

// Globalna definicja statusu tworzona przez administratora
export interface StatusDefinition {
  id: string;
  name: string;
  color: string; // np. "emerald", "blue", "purple", "amber", "rose", "zinc"
  icon: string;  // np. "Clock", "Package", "Truck", "ShoppingBag", "CheckCircle", "AlertTriangle"
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  status: string; // aktualny status (najnowszy)
  status_history: OrderStatusHistoryItem[]; // lista statusów po kolei jak w inpost
  items: OrderItem[];
  revenue?: number; // przychód z zamówienia (domyślnie 0zł)
  notes?: string;
  created_at: string;
  updated_at?: string;
}

