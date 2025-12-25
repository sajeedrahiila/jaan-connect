import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, Product } from '@/lib/types';
import {
  getStoredCart,
  addToCart as addToCartUtil,
  removeFromCart as removeFromCartUtil,
  updateCartItemQuantity as updateQuantityUtil,
  clearCart as clearCartUtil,
} from '@/lib/cart';

interface CartContextType {
  cart: Cart;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, item_count: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setCart(getStoredCart());
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => addToCartUtil(prev, product, quantity));
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => removeFromCartUtil(prev, productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCart(prev => updateQuantityUtil(prev, productId, quantity));
  }, []);

  const clearCart = useCallback(() => {
    setCart(clearCartUtil());
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
