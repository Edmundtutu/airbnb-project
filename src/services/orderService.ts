import api from './api';
import { CreateBookingPayload, Booking } from '@/types/bookings';
import type { ApiResponse } from '@/types/api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export const bookingService = {
  async createBooking(bookingData: CreateBookingPayload): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`${apiVersion}/bookings`, bookingData);
    return response.data.data;
  },

  async getBookings(): Promise<Booking[]> {
    const response = await api.get<ApiResponse<Booking[]>>(`${apiVersion}/bookings`);
    return (response.data as any)?.data ?? response.data;
  },

  async getBooking(bookingId: number): Promise<Booking> {
    const response = await api.get<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}`);
    return response.data.data;
  },

  async cancelBooking(bookingId: number): Promise<{ message: string }> {
    const response = await api.delete(`${apiVersion}/bookings/${bookingId}`);
    return response.data;
  },

  async getHostBookings(): Promise<Booking[]> {
    const response = await api.get<ApiResponse<Booking[]>>(`${apiVersion}/host/bookings`);
    return (response.data as any)?.data ?? response.data;
  },

  async confirmBooking(bookingId: number): Promise<{ message: string }> {
    const response = await api.patch(`${apiVersion}/host/bookings/${bookingId}/confirm`);
    return response.data;
  },

  async rejectBooking(bookingId: number): Promise<{ message: string }> {
    const response = await api.patch(`${apiVersion}/host/bookings/${bookingId}/reject`);
    return response.data;
  },

  async getGuestBookings(): Promise<Booking[]> {
    const response = await api.get<ApiResponse<Booking[]>>(`${apiVersion}/guest/bookings`);
    return (response.data as any)?.data ?? response.data;
  },

  async updateBooking(bookingId: number, data: Partial<Booking>): Promise<Booking> {
    const response = await api.put<ApiResponse<Booking>>(`${apiVersion}/bookings/${bookingId}`, data);
    return response.data.data;
  },
};

// Legacy aliases for backward compatibility
export const createOrder = bookingService.createBooking;
export const getOrders = bookingService.getBookings;
export const getOrder = bookingService.getBooking;
export const cancelOrder = bookingService.cancelBooking;
export const getVendorOrders = bookingService.getHostBookings;
export const confirmOrder = bookingService.confirmBooking;
export const rejectOrder = bookingService.rejectBooking;