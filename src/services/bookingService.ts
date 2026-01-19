import api from './api';
import { CreateBookingPayload, Booking, ListingReservation, HostListingReservation } from '@/types/bookings';
import type { ApiResponse, LaravelPaginatedResponse } from '@/types/api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export const bookingService = {
  async createBooking(bookingData: CreateBookingPayload): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`${apiVersion}/bookings`, bookingData);
    return response.data.data;
  },

  async getBookings(params?: {
    status?: string;
    page?: number;
  }): Promise<LaravelPaginatedResponse<Booking>> {
    const response = await api.get<LaravelPaginatedResponse<Booking>>(`${apiVersion}/bookings`, { params });
    return response.data;
  },

  async getBooking(bookingId: string): Promise<Booking> {
    const response = await api.get<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}`);
    return response.data.data;
  },

  async updateBooking(bookingId: string, data: Partial<Booking>): Promise<Booking> {
    const response = await api.put<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}`, data);
    return response.data.data;
  },

  async cancelBooking(bookingId: string): Promise<{ message: string }> {
    const response = await api.delete(`${apiVersion}/bookings/${bookingId}`);
    return response.data;
  },

  // Guest-specific booking operations
  async getGuestBookings(params?: {
    status?: string;
    upcoming?: boolean;
    past?: boolean;
    page?: number;
  }): Promise<LaravelPaginatedResponse<Booking>> {
    const response = await api.get<LaravelPaginatedResponse<Booking>>(`${apiVersion}/guest/bookings`, { params });
    return response.data;
  },

  async requestBooking(bookingData: {
    listing_id: string; // ULID
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    guest_details?: {
      special_requests?: string;
      arrival_time?: string;
    };
  }): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`${apiVersion}/guest/bookings`, bookingData);
    return response.data.data;
  },

  // Host-specific booking operations  
  async getHostBookings(params?: {
    status?: string;
    property_id?: string; // ULID
    upcoming?: boolean;
    past?: boolean;
    page?: number;
  }): Promise<LaravelPaginatedResponse<Booking>> {
    const response = await api.get<LaravelPaginatedResponse<Booking>>(`${apiVersion}/host/bookings`, { params });
    return response.data;
  },

  async getListingReservations(listingId: string): Promise<ListingReservation[]> {
    const response = await api.get<{ data: ListingReservation[] }>(
      `${apiVersion}/listings/${listingId}/reservations`
    );
    return response.data.data;
  },

  async getHostListingReservations(params: { month: number; year: number }): Promise<HostListingReservation[]> {
    const response = await api.get<{ data: HostListingReservation[] }>(
      `${apiVersion}/host/listings/reservations`,
      { params }
    );
    return response.data.data;
  },

  async confirmBooking(bookingId: string): Promise<{ message: string }> {
    const response = await api.patch(`${apiVersion}/host/bookings/${bookingId}/confirm`);
    return response.data;
  },

  async rejectBooking(bookingId: string, reason?: string): Promise<{ message: string }> {
    const response = await api.patch(`${apiVersion}/host/bookings/${bookingId}/reject`, { reason });
    return response.data;
  },

  // ============================================================
  // STUBBED METHODS - Backend routes not yet implemented
  // These are placeholders for future functionality.
  // DO NOT USE in production until backend support is added.
  // ============================================================

  /**
   * @deprecated STUB - Backend route not implemented
   * @todo Implement POST /host/bookings/{bookingId}/accept route
   */
  async acceptBooking(bookingId: string): Promise<{ message: string }> {
    console.warn('[bookingService.acceptBooking] STUB: Backend route not implemented');
    throw new Error('acceptBooking is not yet supported by the backend');
  },

  /**
   * @deprecated STUB - Backend route not implemented
   * @todo Implement PATCH /bookings/{bookingId}/check-in route
   */
  async markAsCheckedIn(bookingId: string): Promise<Booking> {
    console.warn('[bookingService.markAsCheckedIn] STUB: Backend route not implemented');
    throw new Error('markAsCheckedIn is not yet supported by the backend');
  },

  /**
   * @deprecated STUB - Backend route not implemented
   * @todo Implement PATCH /bookings/{bookingId}/check-out route
   */
  async markAsCheckedOut(bookingId: string): Promise<Booking> {
    console.warn('[bookingService.markAsCheckedOut] STUB: Backend route not implemented');
    throw new Error('markAsCheckedOut is not yet supported by the backend');
  },

  /**
   * @deprecated STUB - Backend route not implemented
   * @todo Implement PATCH /bookings/{bookingId}/complete route
   */
  async markAsCompleted(bookingId: string): Promise<Booking> {
    console.warn('[bookingService.markAsCompleted] STUB: Backend route not implemented');
    throw new Error('markAsCompleted is not yet supported by the backend');
  },

  /**
   * @deprecated STUB - Backend route not implemented
   * @todo Implement GET /host/bookings/stats route
   */
  async getBookingStats(params?: {
    property_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_bookings: number;
    total_revenue: number;
    occupancy_rate: number;
    average_rating: number;
  }> {
    console.warn('[bookingService.getBookingStats] STUB: Backend route not implemented');
    throw new Error('getBookingStats is not yet supported by the backend');
  },

  /**
   * @deprecated STUB - Backend route not implemented
   * @todo Implement POST /bookings/{bookingId}/payment route
   */
  async processPayment(bookingId: string, paymentData: {
    payment_method: string;
    amount: number;
  }): Promise<{ payment_status: string; transaction_id: string }> {
    console.warn('[bookingService.processPayment] STUB: Backend route not implemented');
    throw new Error('processPayment is not yet supported by the backend');
  },

  /**
   * @deprecated STUB - Backend route not implemented
   * @todo Implement POST /bookings/{bookingId}/refund route
   */
  async refundBooking(bookingId: string, refundData: {
    amount: number;
    reason: string;
  }): Promise<{ refund_status: string; refund_id: string }> {
    console.warn('[bookingService.refundBooking] STUB: Backend route not implemented');
    throw new Error('refundBooking is not yet supported by the backend');
  },
};

export const createBooking = bookingService.createBooking;
export const createOrder = bookingService.createBooking;
export const getBookings = bookingService.getBookings;
export const getBooking = bookingService.getBooking;
export const cancelBooking = bookingService.cancelBooking;
export const getHostBookings = bookingService.getHostBookings;
export const getGuestBookings = bookingService.getGuestBookings;
export const confirmBooking = bookingService.confirmBooking;
export const rejectBooking = bookingService.rejectBooking;
export const getListingReservations = bookingService.getListingReservations;
export const getHostListingReservations = bookingService.getHostListingReservations;