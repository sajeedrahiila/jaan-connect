// Jaan Distributors - Cart State Management
// Uses localStorage for persistence, with API abstraction for Odoo sync

import type { Cart, CartItem, Product } from './types';
import { syncCart } from './api';

const CART_STORAGE_KEY = 'jaan_cart';

/**
 * Get cart from localStorage
 */
export function getStoredCart(): Cart {
  if (typeof window === 'undefined') {
    return { items: [], total: 0, item_count: 0 };
  }
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading cart from storage:', error);
  }
  
  return { items: [], total: 0, item_count: 0 };
}

/**
 * Save cart to localStorage
 */
export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

/**
 * Calculate cart totals
 */
function calculateTotals(items: CartItem[]): { total: number; item_count: number } {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const item_count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, item_count };
}

/**
 * Add item to cart
 */
export function addToCart(cart: Cart, product: Product, quantity: number = 1): Cart {
  const existingIndex = cart.items.findIndex(item => item.product_id === product.id);
  
  let updatedItems: CartItem[];
  
  if (existingIndex >= 0) {
    // Update existing item
    updatedItems = cart.items.map((item, index) => {
      if (index === existingIndex) {
        const newQuantity = item.quantity + quantity;
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * product.price,
        };
      }
      return item;
    });
  } else {
    // Add new item
    const newItem: CartItem = {
      product_id: product.id,
      product,
      quantity,
      subtotal: quantity * product.price,
    };
    updatedItems = [...cart.items, newItem];
  }
  
  const { total, item_count } = calculateTotals(updatedItems);
  const newCart: Cart = { items: updatedItems, total, item_count };
  
  saveCart(newCart);
  return newCart;
}

/**
 * Remove item from cart
 */
export function removeFromCart(cart: Cart, productId: number): Cart {
  const updatedItems = cart.items.filter(item => item.product_id !== productId);
  const { total, item_count } = calculateTotals(updatedItems);
  const newCart: Cart = { items: updatedItems, total, item_count };
  
  saveCart(newCart);
  return newCart;
}

/**
 * Update item quantity in cart
 */
export function updateCartItemQuantity(cart: Cart, productId: number, quantity: number): Cart {
  if (quantity <= 0) {
    return removeFromCart(cart, productId);
  }
  
  const updatedItems = cart.items.map(item => {
    if (item.product_id === productId) {
      return {
        ...item,
        quantity,
        subtotal: quantity * item.product.price,
      };
    }
    return item;
  });
  
  const { total, item_count } = calculateTotals(updatedItems);
  const newCart: Cart = { items: updatedItems, total, item_count };
  
  saveCart(newCart);
  return newCart;
}

/**
 * Clear entire cart
 */
export function clearCart(): Cart {
  const emptyCart: Cart = { items: [], total: 0, item_count: 0 };
  saveCart(emptyCart);
  return emptyCart;
}

/**
 * Sync cart with backend (Odoo)
 * This validates stock and prices with the server
 */
export async function syncCartWithServer(cart: Cart): Promise<Cart> {
  const response = await syncCart(cart);
  if (response.success && response.data) {
    saveCart(response.data);
    return response.data;
  }
  return cart;
}
