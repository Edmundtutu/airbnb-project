import api from './api';
import { Booking, ApiResponse, PaginatedResponse } from '@/types';

const apiVersion: string = (import.meta as any).env?.VITE_API_VERSION || '/api/v1';

export const bookingService = {
  async getBookings(params?: {
    status?: string;
    property_id?: number | string;
    page?: number;
  }): Promise<PaginatedResponse<Booking>> {
    const query: any = { ...params };
    if (params?.property_id) {
      query.shop_id = params.property_id;
      delete query.property_id;
    }
    const response = await api.get<PaginatedResponse<Booking>>(`${apiVersion}/bookings`, { params: query });
    return response.data;
  },

  async getBooking(id: number | string): Promise<Booking> {
    const response = await api.get<ApiResponse<Booking>>(`${apiVersion}/bookings/${id}`);
    return response.data.data;
  },

  async createBooking(data: {
    property_id: number | string;
    items: { listing_id: number | string; quantity: number }[];
    delivery_type?: 'pickup' | 'delivery';
    delivery_address?: string;
    notes?: string;
  }): Promise<Booking> {
    const payload = {
      shop_id: data.property_id,
      items: data.items.map(i => ({ product_id: i.listing_id, quantity: i.quantity })),
      delivery_type: data.delivery_type,
      delivery_address: data.delivery_address,
      notes: data.notes,
    };
    const response = await api.post<ApiResponse<Booking>>(`${apiVersion}/bookings`, payload);
    return response.data.data;
  },

  async updateBookingStatus(id: number | string, status: string): Promise<Booking> {
    const response = await api.put<ApiResponse<Booking>>(`${apiVersion}/bookings/${id}/status`, { status });
    return response.data.data;
  },
};

