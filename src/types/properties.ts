import { AuthUser } from './auth';
import { Listing } from './listings';

export interface Review {
  id: string;
  user_id: string;
  user: AuthUser;
  listing_id?: string;
  listing?: Listing;
  property_id?: string;
  property?: Property;
  rating: number;
  comment?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  user: AuthUser;
  content: string;
  images: string[];
  captions?: string[];
  hashtags?: string[];
  listing_id?: string;
  listing?: Listing;
  property_id?: string;
  property?: Property;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  user: AuthUser;
  body: string;
  parent_id?: string;
  depth: number;
  likes_count: number;
  replies_count: number;
  liked_by_user: boolean;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  avatar?: string;
  cover_image?: string;
  host_id: string;
  host?: AuthUser;
  rating: number;
  total_reviews: number;
  phone?: string;
  hours?: {
    [key: string]: { open: string; close: string } | null;
  };
  verified: boolean;
  created_at: string;
  updated_at: string;
  distance?: number;
}

// Legacy interface for backward compatibility
export interface Shop extends Property {
  owner_id: string;
  owner?: AuthUser;
}