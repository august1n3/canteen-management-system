
import { useState } from 'react';
import { MenuItem } from '../types';

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(ci => ci.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map(ci =>
          ci.menuItemId === item.menuItemId
            ? { ...ci, quantity: ci.quantity + item.quantity }
            : ci
        );
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    setCartItems(prev =>
      quantity > 0
        ? prev.map(ci =>
            ci.menuItemId === menuItemId ? { ...ci, quantity } : ci
          )
        : prev.filter(ci => ci.menuItemId !== menuItemId)
    );
  };

  return { cartItems, addToCart, updateQuantity };
}