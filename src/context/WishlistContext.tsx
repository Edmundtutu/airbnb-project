import React, { createContext, useContext, useState, useEffect } from 'react';
import { Listing } from '@/types';

interface WishlistContextType {
  wishlistedListings: Listing[];
  toggleListingWishlist: (listing: Listing) => void;
  isListingWishlisted: (listingId: string) => boolean;
  clearWishlist: () => void;
  removeListingFromFavorites: (listingId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistedListings, setWishlistedListings] = useState<Listing[]>([]);

  // Load wishlisted listings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('wishlistedListings');
    if (saved) {
      try {
        setWishlistedListings(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading wishlisted listings:', error);
      }
    }
  }, []);

  // Save to localStorage whenever wishlisted listings change
  useEffect(() => {
    localStorage.setItem('wishlistedListings', JSON.stringify(wishlistedListings));
  }, [wishlistedListings]);

  const toggleListingWishlist = (listing: Listing) => {
    setWishlistedListings(prev => {
      const exists = prev.find(item => item.id === listing.id);
      if (exists) {
        return prev.filter(item => item.id !== listing.id);
      } else {
        return [...prev, listing];
      }
    });
  };
  
  const removeListingFromFavorites = (listingId: string) => {
    setWishlistedListings(prev => prev.filter(item => item.id !== listingId));
  };

  const isListingWishlisted = (listingId: string): boolean => {
    return wishlistedListings.some(listing => listing.id === listingId);
  };

  const clearWishlist = () => {
    setWishlistedListings([]);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistedListings,
      toggleListingWishlist,
      isListingWishlisted,
      removeListingFromFavorites,
      clearWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};