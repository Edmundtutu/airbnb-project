import type { Listing } from "./listings";
import type { Property } from "./properties";
import type { AuthUser } from "./auth";

export interface CreateBookingAddOnPayload {
  listing_id: string;
  nights: number;
  original_price: number;
  discounted_price: number;
}

export interface CreateBookingDetailPayload {
  listing_id: string; // ULID
  nights: number;
  price_per_night?: number;
  add_ons?: CreateBookingAddOnPayload[];
  detail_total?: number;
  package_savings?: number;
}

export interface CreateBookingPayload {
  property_id: string; // ULID
  details: CreateBookingDetailPayload[];
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  notes?: string;
}

// Legacy interfaces for backward compatibility
export interface CreateOrderAddOnPayload extends CreateBookingAddOnPayload {
  product_id: string;
  quantity: number;
}

export interface CreateOrderItemPayload extends CreateBookingDetailPayload {
  product_id: string;
  quantity: number;
  base_price?: number;
}

export interface CreateOrderPayload extends CreateBookingPayload {
  shop_id: string;
  items: CreateOrderItemPayload[];
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
}

export interface BookingDetail {
  id: number;
  booking_id: number;
  listing_id: string; // ULID
  nights: number;
  price_per_night: number;
  line_total?: number;
  created_at: string;
  updated_at: string;
  listing?: Listing; // Nested listing details
}

export interface ListingReservation {
  id: number;
  property_id: string;
  listing_id: string;
  check_in_date: string;
  check_out_date: string;
  status: Booking['status'];
  guest_count: number;
}

export interface HostListingReservation {
  id: string;
  booking_id: string;
  listing_id: string;
  listing_name?: string;
  property_id: string;
  property_name?: string;
  guest_id: string;
  guest_name?: string;
  guest_count: number;
  status: Booking['status'];
  check_in_date: string;
  check_out_date: string;
}

export interface Booking {
  id: number;
  guest_id: string; // ULID
  property_id: string; // ULID
  total: number;
  status: 'pending' | 'processing' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'rejected';
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  details: BookingDetail[];
  guest?: AuthUser; // Nested user details for host bookings
  property?: Property;
}

// Legacy interfaces for backward compatibility
export interface OrderItem extends BookingDetail {
  order_id: number;
  product_id: string;
  quantity: number;
  price: number;
  product?: Listing;
}

export interface Order extends Booking {
  user_id: string;
  shop_id: string;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  items: OrderItem[];
  user?: AuthUser;
  shop?: Property;
}
