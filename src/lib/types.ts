// Jaan Distributors - Type Definitions
// These types are designed to map cleanly to Odoo 19 CE models

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  product_count: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  sku: string;
  barcode?: string;
  category_id: number;
  category_name: string;
  images: string[];
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  unit: string;
  weight?: number;
  is_featured?: boolean;
  is_new?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface Address {
  id?: number;
  name: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  is_default?: boolean;
}

export interface OrderLine {
  product_id: number;
  product_name: string;
  quantity: number;
  price_unit: number;
  subtotal: number;
}

export interface Order {
  id: number;
  name: string; // Order reference (e.g., "SO001")
  date_order: string;
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel';
  partner_id: number;
  partner_name: string;
  shipping_address: Address;
  billing_address: Address;
  order_lines: OrderLine[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  payment_method?: string;
  notes?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  partner_id: number;
  addresses: Address[];
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ProductFilters {
  category_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  sort_by?: 'name' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  per_page?: number;
}
