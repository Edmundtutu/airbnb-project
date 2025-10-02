import api from './api';
import { CreateBookingPayload, Booking } from '@/types/bookings';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export const bookingService = {
  async createBooking(bookingData: CreateBookingPayload): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`${apiVersion}/bookings`, bookingData);
    return response.data.data;
  },

  async getBookings(params?: {
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<Booking>> {
    const response = await api.get<PaginatedResponse<Booking>>(`${apiVersion}/bookings`, { params });
    return response.data;
  },

  async getBooking(bookingId: number): Promise<Booking> {
    const response = await api.get<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}`);
    return response.data.data;
  },

  async updateBooking(bookingId: number, data: Partial<Booking>): Promise<Booking> {
    const response = await api.put<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}`, data);
    return response.data.data;
  },

  async cancelBooking(bookingId: number): Promise<{ message: string }> {
    const response = await api.delete(`${apiVersion}/bookings/${bookingId}`);
    return response.data;
  },

  // Guest-specific booking operations
  async getGuestBookings(params?: {
    status?: string;
    upcoming?: boolean;
    past?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<Booking>> {
    const response = await api.get<PaginatedResponse<Booking>>(`${apiVersion}/guest/bookings`, { params });
    return response.data;
  },

  async requestBooking(bookingData: {
    listing_id: number;
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
    property_id?: number;
    upcoming?: boolean;
    past?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<Booking>> {
    const response = await api.get<PaginatedResponse<Booking>>(`${apiVersion}/host/bookings`, { params });
    return response.data;
  },

  async confirmBooking(bookingId: number): Promise<{ message: string }> {
    const response = await api.patch(`${apiVersion}/host/bookings/${bookingId}/confirm`);
    return response.data;
  },

  async rejectBooking(bookingId: number, reason?: string): Promise<{ message: string }> {
    const response = await api.patch(`${apiVersion}/host/bookings/${bookingId}/reject`, { reason });
    return response.data;
  },

  async acceptBooking(bookingId: number): Promise<{ message: string }> {
    const response = await api.patch(`${apiVersion}/host/bookings/${bookingId}/accept`);
    return response.data;
  },

  // Booking status updates
  async markAsCheckedIn(bookingId: number): Promise<Booking> {
    const response = await api.patch<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}/check-in`);
    return response.data.data;
  },

  async markAsCheckedOut(bookingId: number): Promise<Booking> {
    const response = await api.patch<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}/check-out`);
    return response.data.data;
  },

  async markAsCompleted(bookingId: number): Promise<Booking> {
    const response = await api.patch<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}/complete`);
    return response.data.data;
  },

  // Booking analytics
  async getBookingStats(params?: {
    property_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_bookings: number;
    total_revenue: number;
    occupancy_rate: number;
    average_rating: number;
  }> {
    const response = await api.get(`${apiVersion}/host/bookings/stats`, { params });
    return response.data;
  },

  // Payment-related operations
  async processPayment(bookingId: number, paymentData: {
    payment_method: string;
    amount: number;
  }): Promise<{ payment_status: string; transaction_id: string }> {
    const response = await api.post(`${apiVersion}/bookings/${bookingId}/payment`, paymentData);
    return response.data;
  },

  async refundBooking(bookingId: number, refundData: {
    amount: number;
    reason: string;
  }): Promise<{ refund_status: string; refund_id: string }> {
    const response = await api.post(`${apiVersion}/bookings/${bookingId}/refund`, refundData);
    return response.data;
  },
};

export const createBooking = bookingService.createBooking;
export const createOrder = bookingService.createBooking;
export const getBookings = bookingService.getBookings;
export const getBooking = bookingService.getBooking;
export const cancelBooking = bookingService.cancelBooking;
export const getHostBookings = bookingService.getHostBookings;
export const confirmBooking = bookingService.confirmBooking;
export const rejectBooking = bookingService.rejectBooking;