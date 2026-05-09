import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

export interface CartItem {
  id: string | number;
  nameKey: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string | number, variant?: string) => void;
  updateQuantity: (id: string | number, quantity: number, variant?: string) => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ayurveda_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const { t } = useLanguage();

  useEffect(() => {
    localStorage.setItem('ayurveda_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.id === newItem.id && item.variant === newItem.variant
      );

      if (existingItemIndex >= 0) {
        const updated = [...prev];
        const existingItem = updated[existingItemIndex];
        updated[existingItemIndex] = { 
          ...existingItem, 
          quantity: existingItem.quantity + (newItem.quantity || 1) 
        };
        return updated;
      }

      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });

    const productName = t.products[newItem.nameKey as keyof typeof t.products] || newItem.nameKey;
    toast.success(`${productName} ${t.products.addedToCart}`);
  };

  const removeFromCart = (id: string | number, variant?: string) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.variant === variant)));
  };

  const updateQuantity = (id: string | number, quantity: number, variant?: string) => {
    setCartItems(prev => prev.map(item =>
      item.id === id && item.variant === variant ? { ...item, quantity } : item
    ));
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
