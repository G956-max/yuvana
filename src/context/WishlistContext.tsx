import React, { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

export interface WishlistItem {
  id: string | number;
  nameKey: string;
  price: string;
  image: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string | number) => void;
  isInWishlist: (id: string | number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const { t } = useLanguage();

  const addToWishlist = (newItem: WishlistItem) => {
    setWishlistItems(prev => {
      if (prev.some(item => item.id === newItem.id)) {
        return prev;
      }
      return [...prev, newItem];
    });

    const productName = t.products[newItem.nameKey as keyof typeof t.products] || newItem.nameKey;
    toast.success(`${productName} added to wishlist!`);
  };

  const removeFromWishlist = (id: string | number) => {
    setWishlistItems(prev => prev.filter(item => item.id !== id));
  };

  const isInWishlist = (id: string | number) => {
    return wishlistItems.some(item => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
