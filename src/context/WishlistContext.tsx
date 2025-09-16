import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Listing } from '@/types';

type WishlistContextValue = {
  wishlistListings: Listing[];
  isListingWishlisted: (listingId: string) => boolean;
  addListingToWishlist: (listing: Listing) => void;
  removeListingFromWishlist: (listingId: string) => void;
  toggleListingWishlist: (listing: Listing) => void;
  clearWishlist: () => void;
  
  // Legacy methods for backward compatibility
  favoriteProducts: Listing[];
  isProductFavorited: (listingId: string) => boolean;
  addProductToFavorites: (listing: Listing) => void;
  removeProductFromFavorites: (listingId: string) => void;
  toggleProductFavorite: (listing: Listing) => void;
  clearFavorites: () => void;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'wishlist_listings_v1';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistListings, setWishlistListings] = useState<Listing[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) {
        const parsed: Listing[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWishlistListings(parsed);
        }
      }
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistListings));
    } catch (_) {
      // ignore
    }
  }, [wishlistListings]);

  const isListingWishlisted = (listingId: string) => {
    return wishlistListings.some(l => l.id === listingId);
  };

  const addListingToWishlist = (listing: Listing) => {
    setWishlistListings(prev => {
      if (prev.some(l => l.id === listing.id)) return prev;
      return [listing, ...prev];
    });
  };

  const removeListingFromWishlist = (listingId: string) => {
    setWishlistListings(prev => prev.filter(l => l.id !== listingId));
  };

  const toggleListingWishlist = (listing: Listing) => {
    setWishlistListings(prev => {
      const exists = prev.some(l => l.id === listing.id);
      if (exists) return prev.filter(l => l.id !== listing.id);
      return [listing, ...prev];
    });
  };

  const clearWishlist = () => setWishlistListings([]);

  // Legacy methods for backward compatibility
  const isProductFavorited = isListingWishlisted;
  const addProductToFavorites = addListingToWishlist;
  const removeProductFromFavorites = removeListingFromWishlist;
  const toggleProductFavorite = toggleListingWishlist;
  const clearFavorites = clearWishlist;

  const value = useMemo<WishlistContextValue>(() => ({
    wishlistListings,
    isListingWishlisted,
    addListingToWishlist,
    removeListingFromWishlist,
    toggleListingWishlist,
    clearWishlist,
    // Legacy properties for backward compatibility
    favoriteProducts: wishlistListings,
    isProductFavorited,
    addProductToFavorites,
    removeProductFromFavorites,
    toggleProductFavorite,
    clearFavorites,
  }), [wishlistListings]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextValue => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};

// Legacy exports for backward compatibility
export const FavoritesProvider = WishlistProvider;
export const useFavorites = useWishlist;


