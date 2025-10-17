import { AuthUser } from './auth';
import { Property } from './properties';

export interface Listing {
  id: string;
  name: string;
  description?: string;
  price_per_night: number;
  images: string[];
  category: string;
  property_id: string;
  property: Property;
  max_guests: number;
  rating: number;
  total_reviews: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Legacy interface for backward compatibility
export interface Product extends Listing {
  price: number;
  shop_id: string;
  shop: Property;
  stock: number;
}