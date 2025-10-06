'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateSpecialInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCartItem: (menuItemId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'canteen_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('Cart updated:', cartItems);
    if (cartItems.length > 0) {
      console.log('Saving cart to localStorage');
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    console.log('Adding to cart:', item);
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (cartItem) => cartItem.menuItemId === item.menuItemId
      );

      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.menuItemId === item.menuItemId
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      } else {
        return [...prevItems, item];
      }
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.menuItemId !== menuItemId)
    );
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const updateSpecialInstructions = (
    menuItemId: string,
    instructions: string
  ) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, specialInstructions: instructions }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartItem = (menuItemId: string) => {
    return cartItems.find((item) => item.menuItemId === menuItemId);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateSpecialInstructions,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getCartItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// TODO: Add cart persistence across sessions
// TODO: Implement cart expiration for items
// TODO: Add cart validation against current menu availability
// TODO: Implement cart sharing functionality