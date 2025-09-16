import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Listing, Property } from '@/types';

export interface BookingAddOn {
  id: string;
  listing: Listing;
  nights: number;
  originalPrice: number;
  discountedPrice: number;
  discountType?: 'percentage' | 'fixed' | 'none';
  discountValue?: number;
  addedAt: Date;
}

export interface BookingItem {
  id: string;
  listing: Listing;
  property: Property;
  nights: number;
  // base price per night of the main listing (kept for historical accuracy if listing.price changes)
  basePricePerNight: number;
  // optional add-ons for this booking item
  addOns?: BookingAddOn[];
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
  addedAt: Date;
}

interface BookingState {
  items: BookingItem[];
  isLoading: boolean;
}

interface BookingContextType extends BookingState {
  addItem: (listing: Listing, nights: number, property: Property, checkInDate: Date, checkOutDate: Date, guests: number) => void;
  removeItem: (itemId: string) => void;
  updateNights: (itemId: string, nights: number) => void;
  clearBooking: () => void;
  clearPropertyItems: (propertyId: string) => void;
  getTotal: () => number; // legacy total without add-ons
  getTotalWithAddOns: () => number; // enhanced total including add-ons
  getItemTotalWithAddOns: (itemId: string) => number;
  getItemSavings: (itemId: string) => number;
  getItemAddOns: (itemId: string) => BookingAddOn[];
  getItemCount: () => number;
  getPropertyTotal: (propertyId: string) => number;
  getItemsByProperty: () => Record<string, BookingItem[]>;
  addAddOn: (
    itemId: string,
    addOnListing: Listing,
    nights: number,
    discountedPrice?: number,
    discountType?: 'percentage' | 'fixed' | 'none',
    discountValue?: number
  ) => void;
  removeAddOn: (itemId: string, addOnId: string) => void;
  updateAddOnNights: (itemId: string, addOnId: string, nights: number) => void;
  canCheckout: boolean;
}

type BookingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ITEMS'; payload: BookingItem[] }
  | { type: 'ADD_ITEM'; payload: BookingItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_NIGHTS'; payload: { id: string; nights: number } }
  | { type: 'CLEAR_BOOKING' }
  | { type: 'CLEAR_PROPERTY_ITEMS'; payload: string }
  | { type: 'ADD_ADDON'; payload: { itemId: string; addOn: BookingAddOn } }
  | { type: 'REMOVE_ADDON'; payload: { itemId: string; addOnId: string } }
  | { type: 'UPDATE_ADDON_NIGHTS'; payload: { itemId: string; addOnId: string; nights: number } };

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isLoading: false };
    
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(
        item => item.listing.id === action.payload.listing.id
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item nights
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          nights: updatedItems[existingItemIndex].nights + action.payload.nights,
        };
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        return { ...state, items: [...state.items, action.payload] };
      }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    
    case 'UPDATE_NIGHTS':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, nights: action.payload.nights }
            : item
        ),
      };
    
    case 'CLEAR_BOOKING':
      return { ...state, items: [] };
    
    case 'CLEAR_PROPERTY_ITEMS':
      return {
        ...state,
        items: state.items.filter(item => item.property.id !== action.payload),
      };

    case 'ADD_ADDON':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                addOns: [...(item.addOns ?? []), action.payload.addOn],
              }
            : item
        ),
      };

    case 'REMOVE_ADDON':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                addOns: (item.addOns ?? []).filter(a => a.id !== action.payload.addOnId),
              }
            : item
        ),
      };

    case 'UPDATE_ADDON_NIGHTS':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                addOns: (item.addOns ?? []).map(a =>
                  a.id === action.payload.addOnId ? { ...a, nights: action.payload.nights } : a
                ),
              }
            : item
        ),
      };
    
    default:
      return state;
  }
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

// Legacy export for backward compatibility
export const useCart = useBooking;

const BOOKING_STORAGE_KEY = 'airbnb-booking';

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, {
    items: [],
    isLoading: true,
  });

  // Load booking from localStorage on mount
  useEffect(() => {
    try {
      const savedBooking = localStorage.getItem(BOOKING_STORAGE_KEY);
      if (savedBooking) {
        const parsedBooking = JSON.parse(savedBooking);
        // Convert date strings back to Date objects
        const itemsWithDates = parsedBooking.map((item: any) => ({
          ...item,
          // migrate legacy price -> basePricePerNight
          basePricePerNight: item.basePricePerNight ?? item.basePrice ?? item.listing?.price_per_night ?? 0,
          // ensure dates are parsed
          checkInDate: new Date(item.checkInDate),
          checkOutDate: new Date(item.checkOutDate),
          addOns: (item.addOns ?? []).map((a: any) => ({
            ...a,
            addedAt: new Date(a.addedAt),
          })),
          addedAt: new Date(item.addedAt),
        }));
        dispatch({ type: 'SET_ITEMS', payload: itemsWithDates });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to load booking from localStorage:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Save booking to localStorage whenever items change
  useEffect(() => {
    if (!state.isLoading) {
      try {
        localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(state.items));
      } catch (error) {
        console.error('Failed to save booking to localStorage:', error);
      }
    }
  }, [state.items, state.isLoading]);

  const addItem = (listing: Listing, nights: number, property: Property, checkInDate: Date, checkOutDate: Date, guests: number) => {
    const bookingItem: BookingItem = {
      id: `${listing.id}-${Date.now()}`,
      listing,
      property,
      nights,
      basePricePerNight: listing.price_per_night,
      checkInDate,
      checkOutDate,
      guests,
      addedAt: new Date(),
    };
    dispatch({ type: 'ADD_ITEM', payload: bookingItem });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateNights = (itemId: string, nights: number) => {
    if (nights <= 0) {
      removeItem(itemId);
    } else {
      dispatch({ type: 'UPDATE_NIGHTS', payload: { id: itemId, nights } });
    }
  };

  const clearBooking = () => {
    dispatch({ type: 'CLEAR_BOOKING' });
  };

  const clearPropertyItems = (propertyId: string) => {
    dispatch({ type: 'CLEAR_PROPERTY_ITEMS', payload: propertyId });
  };

  const getTotal = (): number => {
    return state.items.reduce((total, item) => total + (item.basePricePerNight * item.nights), 0);
  };

  const getItemCount = (): number => {
    return state.items.reduce((count, item) => count + item.nights, 0);
  };

  const getPropertyTotal = (propertyId: string): number => {
    return state.items
      .filter(item => item.property.id === propertyId)
      .reduce((total, item) => total + (item.basePricePerNight * item.nights), 0);
  };

  const getItemsByProperty = (): Record<string, BookingItem[]> => {
    return state.items.reduce((acc, item) => {
      const propertyId = item.property.id;
      if (!acc[propertyId]) {
        acc[propertyId] = [];
      }
      acc[propertyId].push(item);
      return acc;
    }, {} as Record<string, BookingItem[]>);
  };

  const canCheckout = state.items.length > 0;

  // Helpers for add-ons and totals
  const getItemAddOns = (itemId: string): BookingAddOn[] => {
    const item = state.items.find(i => i.id === itemId);
    return item?.addOns ?? [];
  };

  const getItemTotalWithAddOns = (itemId: string): number => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return 0;
    const addOnsTotalPerNight = (item.addOns ?? []).reduce((sum, a) => sum + a.discountedPrice * a.nights, 0);
    return item.basePricePerNight * item.nights + addOnsTotalPerNight * item.nights;
  };

  const getItemSavings = (itemId: string): number => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return 0;
    return (item.addOns ?? []).reduce((s, a) => s + (a.originalPrice - a.discountedPrice) * a.nights, 0);
  };

  const getTotalWithAddOns = (): number => {
    return state.items.reduce((sum, item) => sum + getItemTotalWithAddOns(item.id), 0);
  };

  const addAddOn: BookingContextType['addAddOn'] = (
    itemId,
    addOnListing,
    nights,
    discountedPrice,
    discountType = 'none',
    discountValue
  ) => {
    const addOn: BookingAddOn = {
      id: `${addOnListing.id}-${Date.now()}`,
      listing: addOnListing,
      nights,
      originalPrice: addOnListing.price_per_night,
      discountedPrice: typeof discountedPrice === 'number' ? discountedPrice : addOnListing.price_per_night,
      discountType,
      discountValue,
      addedAt: new Date(),
    };
    dispatch({ type: 'ADD_ADDON', payload: { itemId, addOn } });
  };

  const removeAddOn: BookingContextType['removeAddOn'] = (itemId, addOnId) => {
    dispatch({ type: 'REMOVE_ADDON', payload: { itemId, addOnId } });
  };

  const updateAddOnNights: BookingContextType['updateAddOnNights'] = (itemId, addOnId, nights) => {
    if (nights <= 0) {
      dispatch({ type: 'REMOVE_ADDON', payload: { itemId, addOnId } });
    } else {
      dispatch({ type: 'UPDATE_ADDON_NIGHTS', payload: { itemId, addOnId, nights } });
    }
  };

  return (
    <BookingContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateNights,
        clearBooking,
        clearPropertyItems,
        getTotal,
        getItemCount,
        getPropertyTotal,
        getItemsByProperty,
        getTotalWithAddOns,
        getItemTotalWithAddOns,
        getItemSavings,
        getItemAddOns,
        addAddOn,
        removeAddOn,
        updateAddOnNights,
        canCheckout,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

// Legacy export for backward compatibility
export const CartProvider = BookingProvider;