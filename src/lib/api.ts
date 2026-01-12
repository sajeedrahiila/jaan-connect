// Jaan Distributors - API Abstraction Layer
// All API calls are centralized here for easy replacement with Odoo 19 CE endpoints

import type {
  Category,
  Product,
  Cart,
  CartItem,
  Order,
  User,
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
  ProductFilters,
  Address,
} from './types';

// API Base URL - Configure in environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Mock data for development
const mockCategories: Category[] = [
  { id: 1, name: 'Fresh Produce', slug: 'fresh-produce', description: 'Farm-fresh fruits and vegetables', image: '/placeholder.svg', product_count: 45 },
  { id: 2, name: 'Dairy & Eggs', slug: 'dairy-eggs', description: 'Fresh dairy products and eggs', image: '/placeholder.svg', product_count: 32 },
  { id: 3, name: 'Meat & Seafood', slug: 'meat-seafood', description: 'Quality meats and fresh seafood', image: '/placeholder.svg', product_count: 28 },
  { id: 4, name: 'Bakery', slug: 'bakery', description: 'Fresh baked goods daily', image: '/placeholder.svg', product_count: 24 },
  { id: 5, name: 'Pantry Staples', slug: 'pantry-staples', description: 'Essential cooking ingredients', image: '/placeholder.svg', product_count: 67 },
  { id: 6, name: 'Beverages', slug: 'beverages', description: 'Drinks and refreshments', image: '/placeholder.svg', product_count: 41 },
  { id: 7, name: 'Frozen Foods', slug: 'frozen-foods', description: 'Frozen meals and ingredients', image: '/placeholder.svg', product_count: 35 },
  { id: 8, name: 'Snacks', slug: 'snacks', description: 'Chips, nuts, and treats', image: '/placeholder.svg', product_count: 52 },
];

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Organic Bananas',
    slug: 'organic-bananas',
    description: 'Premium organic bananas sourced from sustainable farms. Perfect for smoothies, baking, or as a healthy snack.',
    short_description: 'Fresh organic bananas',
    price: 2.99,
    compare_price: 3.49,
    sku: 'FP-001',
    category_id: 1,
    category_name: 'Fresh Produce',
    images: ['/placeholder.svg'],
    stock_quantity: 150,
    stock_status: 'in_stock',
    unit: 'bunch',
    weight: 1.2,
    is_featured: true,
    is_new: false,
    created_at: '2024-01-15',
    updated_at: '2024-01-20',
  },
  {
    id: 2,
    name: 'Farm Fresh Eggs',
    slug: 'farm-fresh-eggs',
    description: 'Free-range eggs from local farms. Rich in flavor and nutrients, perfect for any meal.',
    short_description: 'Free-range eggs, dozen',
    price: 5.99,
    sku: 'DE-001',
    category_id: 2,
    category_name: 'Dairy & Eggs',
    images: ['/placeholder.svg'],
    stock_quantity: 80,
    stock_status: 'in_stock',
    unit: 'dozen',
    is_featured: true,
    is_new: false,
    created_at: '2024-01-10',
    updated_at: '2024-01-20',
  },
  {
    id: 3,
    name: 'Atlantic Salmon Fillet',
    slug: 'atlantic-salmon-fillet',
    description: 'Fresh Atlantic salmon, sustainably sourced. Rich in omega-3 fatty acids and perfect for grilling or baking.',
    short_description: 'Fresh salmon fillet',
    price: 14.99,
    compare_price: 17.99,
    sku: 'MS-001',
    category_id: 3,
    category_name: 'Meat & Seafood',
    images: ['/placeholder.svg'],
    stock_quantity: 25,
    stock_status: 'in_stock',
    unit: 'lb',
    weight: 1,
    is_featured: true,
    is_new: true,
    created_at: '2024-01-18',
    updated_at: '2024-01-20',
  },
  {
    id: 4,
    name: 'Artisan Sourdough Bread',
    slug: 'artisan-sourdough-bread',
    description: 'Handcrafted sourdough bread made with traditional fermentation methods. Crusty exterior with soft, tangy interior.',
    short_description: 'Fresh baked sourdough',
    price: 6.49,
    sku: 'BK-001',
    category_id: 4,
    category_name: 'Bakery',
    images: ['/placeholder.svg'],
    stock_quantity: 30,
    stock_status: 'in_stock',
    unit: 'loaf',
    is_featured: false,
    is_new: true,
    created_at: '2024-01-19',
    updated_at: '2024-01-20',
  },
  {
    id: 5,
    name: 'Extra Virgin Olive Oil',
    slug: 'extra-virgin-olive-oil',
    description: 'Cold-pressed extra virgin olive oil from Mediterranean olives. Perfect for cooking and dressings.',
    short_description: 'Premium olive oil, 1L',
    price: 12.99,
    sku: 'PS-001',
    category_id: 5,
    category_name: 'Pantry Staples',
    images: ['/placeholder.svg'],
    stock_quantity: 60,
    stock_status: 'in_stock',
    unit: 'bottle',
    weight: 1,
    is_featured: true,
    is_new: false,
    created_at: '2024-01-05',
    updated_at: '2024-01-20',
  },
  {
    id: 6,
    name: 'Fresh Squeezed Orange Juice',
    slug: 'fresh-squeezed-orange-juice',
    description: 'Freshly squeezed orange juice with no added sugar. Pure, refreshing, and packed with vitamin C.',
    short_description: 'Fresh OJ, 64oz',
    price: 7.99,
    sku: 'BV-001',
    category_id: 6,
    category_name: 'Beverages',
    images: ['/placeholder.svg'],
    stock_quantity: 45,
    stock_status: 'in_stock',
    unit: 'bottle',
    is_featured: false,
    is_new: false,
    created_at: '2024-01-12',
    updated_at: '2024-01-20',
  },
  {
    id: 7,
    name: 'Organic Baby Spinach',
    slug: 'organic-baby-spinach',
    description: 'Tender organic baby spinach leaves, pre-washed and ready to eat. Perfect for salads and smoothies.',
    short_description: 'Organic spinach, 5oz',
    price: 4.49,
    sku: 'FP-002',
    category_id: 1,
    category_name: 'Fresh Produce',
    images: ['/placeholder.svg'],
    stock_quantity: 5,
    stock_status: 'low_stock',
    unit: 'bag',
    is_featured: false,
    is_new: false,
    created_at: '2024-01-08',
    updated_at: '2024-01-20',
  },
  {
    id: 8,
    name: 'Greek Yogurt',
    slug: 'greek-yogurt',
    description: 'Creamy Greek yogurt with live active cultures. High protein, low fat, perfect for breakfast or snacking.',
    short_description: 'Plain Greek yogurt, 32oz',
    price: 6.99,
    sku: 'DE-002',
    category_id: 2,
    category_name: 'Dairy & Eggs',
    images: ['/placeholder.svg'],
    stock_quantity: 0,
    stock_status: 'out_of_stock',
    unit: 'container',
    is_featured: false,
    is_new: false,
    created_at: '2024-01-06',
    updated_at: '2024-01-20',
  },
];

const mockUser: User = {
  id: 1,
  name: 'John Smith',
  email: 'john@example.com',
  phone: '+1 555-123-4567',
  partner_id: 1,
  addresses: [
    {
      id: 1,
      name: 'Home',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
      phone: '+1 555-123-4567',
      is_default: true,
    },
  ],
  created_at: '2024-01-01',
};

const mockOrders: Order[] = [
  {
    id: 1,
    name: 'SO-2024-001',
    date_order: '2024-01-15T10:30:00',
    state: 'done',
    partner_id: 1,
    partner_name: 'John Smith',
    shipping_address: mockUser.addresses[0],
    billing_address: mockUser.addresses[0],
    order_lines: [
      { product_id: 1, product_name: 'Organic Bananas', quantity: 2, price_unit: 2.99, subtotal: 5.98 },
      { product_id: 5, product_name: 'Extra Virgin Olive Oil', quantity: 1, price_unit: 12.99, subtotal: 12.99 },
    ],
    amount_untaxed: 18.97,
    amount_tax: 1.52,
    amount_total: 20.49,
    payment_method: 'Cash on Delivery',
  },
  {
    id: 2,
    name: 'SO-2024-002',
    date_order: '2024-01-18T14:45:00',
    state: 'sale',
    partner_id: 1,
    partner_name: 'John Smith',
    shipping_address: mockUser.addresses[0],
    billing_address: mockUser.addresses[0],
    order_lines: [
      { product_id: 3, product_name: 'Atlantic Salmon Fillet', quantity: 2, price_unit: 14.99, subtotal: 29.98 },
      { product_id: 4, product_name: 'Artisan Sourdough Bread', quantity: 1, price_unit: 6.49, subtotal: 6.49 },
    ],
    amount_untaxed: 36.47,
    amount_tax: 2.92,
    amount_total: 39.39,
    payment_method: 'Cash on Delivery',
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// CATEGORIES API
// ============================================

/**
 * Fetch all product categories
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/categories
 */
export async function getCategories(): Promise<ApiResponse<Category[]>> {
  const res = await fetch(`${API_BASE_URL}/api/categories`);
  const data = await res.json();
  return data;
}

/**
 * Fetch a single category by slug
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/categories/{slug}
 */
export async function getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
  const res = await fetch(`${API_BASE_URL}/api/categories`);
  const data = await res.json();
  if (data.success && data.data) {
    const category = (data.data as Category[]).find(c => c.slug === slug);
    if (category) return { success: true, data: category };
  }
  return { success: false, error: 'Category not found' };
}

// ============================================
// PRODUCTS API
// ============================================

/**
 * Fetch products with optional filters
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/products
 */
export async function getProducts(filters?: ProductFilters): Promise<ApiResponse<PaginatedResponse<Product>>> {
  const params = new URLSearchParams();
  if (filters?.category_id) params.set('category_id', String(filters.category_id));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.in_stock_only) params.set('in_stock_only', 'true');
  if (filters?.min_price !== undefined) params.set('min_price', String(filters.min_price));
  if (filters?.max_price !== undefined) params.set('max_price', String(filters.max_price));
  if (filters?.sort_by) params.set('sort_by', filters.sort_by);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.per_page) params.set('per_page', String(filters.per_page));

  const res = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`);
  const data = await res.json();
  return data;
}

/**
 * Fetch featured products
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/products?featured=true
 */
export async function getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
  const res = await fetch(`${API_BASE_URL}/api/products?in_stock_only=true&sort_by=newest&per_page=8`);
  const data = await res.json();
  if (data?.data?.data) {
    const featured = (data.data.data as Product[]).filter(p => p.is_featured);
    return { success: true, data: featured };
  }
  return { success: false, error: 'Failed to fetch featured products' };
}

/**
 * Fetch a single product by slug
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/products/{slug}
 */
export async function getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
  const res = await fetch(`${API_BASE_URL}/api/products/slug/${slug}`);
  const data = await res.json();
  return data;
}

/**
 * Fetch a single product by ID
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/products/{id}
 */
export async function getProductById(id: number): Promise<ApiResponse<Product>> {
  await delay(200);
  const product = mockProducts.find(p => p.id === id);
  if (product) {
    return { success: true, data: product };
  }
  return { success: false, error: 'Product not found' };
}

// ============================================
// CART API
// ============================================

/**
 * Sync cart with server
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: POST /api/cart
 */
export async function syncCart(cart: Cart): Promise<ApiResponse<Cart>> {
  await delay(200);
  // In production, this would validate stock and prices with Odoo
  return { success: true, data: cart };
}

// ============================================
// ORDERS API
// ============================================

/**
 * Create a new order
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: POST /api/orders
 */
export async function createOrder(orderData: {
  cart: Cart;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  notes?: string;
}): Promise<ApiResponse<Order>> {
  await delay(500);
  
  const newOrder: Order = {
    id: Math.floor(Math.random() * 10000),
    name: `SO-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date_order: new Date().toISOString(),
    state: 'sale',
    partner_id: 1,
    partner_name: orderData.shipping_address.name,
    shipping_address: orderData.shipping_address,
    billing_address: orderData.billing_address,
    order_lines: orderData.cart.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product.name,
      quantity: item.quantity,
      price_unit: item.product.price,
      subtotal: item.subtotal,
    })),
    amount_untaxed: orderData.cart.total,
    amount_tax: orderData.cart.total * 0.08, // 8% tax
    amount_total: orderData.cart.total * 1.08,
    payment_method: orderData.payment_method,
    notes: orderData.notes,
  };
  
  return { success: true, data: newOrder, message: 'Order placed successfully!' };
}

/**
 * Fetch user's orders
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/orders
 */
export async function getOrders(): Promise<ApiResponse<Order[]>> {
  await delay(400);
  return { success: true, data: mockOrders };
}

/**
 * Fetch a single order by ID
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/orders/{id}
 */
export async function getOrderById(id: number): Promise<ApiResponse<Order>> {
  await delay(300);
  const order = mockOrders.find(o => o.id === id);
  if (order) {
    return { success: true, data: order };
  }
  return { success: false, error: 'Order not found' };
}

// ============================================
// AUTH API
// ============================================

/**
 * User login
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: POST /api/auth/login
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  await delay(500);
  
  // Mock authentication
  if (email === 'demo@jaan.com' && password === 'demo123') {
    return {
      success: true,
      user: mockUser,
      token: 'mock-jwt-token-12345',
    };
  }
  
  return {
    success: false,
    error: 'Invalid email or password',
  };
}

/**
 * User registration
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: POST /api/auth/register
 */
export async function register(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  await delay(500);
  
  // Mock registration
  const newUser: User = {
    id: Math.floor(Math.random() * 10000),
    name: data.name,
    email: data.email,
    phone: data.phone,
    partner_id: Math.floor(Math.random() * 10000),
    addresses: [],
    created_at: new Date().toISOString(),
  };
  
  return {
    success: true,
    user: newUser,
    token: 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9),
  };
}

/**
 * Get current user account
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: GET /api/account
 */
export async function getAccount(): Promise<ApiResponse<User>> {
  await delay(300);
  return { success: true, data: mockUser };
}

/**
 * Update user profile
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: PUT /api/account
 */
export async function updateAccount(data: Partial<User>): Promise<ApiResponse<User>> {
  await delay(400);
  return { success: true, data: { ...mockUser, ...data } };
}

/**
 * Logout user
 * TODO: Replace with Odoo 19 CE REST endpoint
 * Odoo endpoint: POST /api/auth/logout
 */
export async function logout(): Promise<ApiResponse<null>> {
  await delay(200);
  return { success: true, data: null };
}
