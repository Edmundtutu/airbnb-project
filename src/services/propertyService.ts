import api from './api';
import { Property, PaginatedResponse, ApiResponse, Listing, Review } from '@/types';

// Reuse existing API version constant from product/shop services if needed
const apiVersion: string = (import.meta as any).env?.VITE_API_VERSION || '/api/v1';

export const propertyService = {
  async getProperties(params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    search?: string;
    category?: string;
    owner_id?: string | number;
    page?: number;
  }): Promise<PaginatedResponse<Property>> {
    const response = await api.get(`${apiVersion}/properties`, { params });
    return response.data;
  },

  async getProperty(id: string | number): Promise<Property> {
    const response = await api.get<ApiResponse<Property>>(`${apiVersion}/properties/${id}`);
    return (response.data as any).data ?? (response.data as any);
  },

  async getPropertyListings(propertyId: string | number): Promise<Listing[]> {
    const response = await api.get(`${apiVersion}/listings`, { params: { shop_id: propertyId } });
    if ((response.data as any)?.data) return (response.data as any).data;
    return response.data ?? [];
  },

  async getPropertyReviews(propertyId: string | number): Promise<Review[]> {
    const response = await api.get(`${apiVersion}/reviews`, { params: { shop_id: propertyId } });
    if ((response.data as any)?.data) return (response.data as any).data;
    return response.data ?? [];
  },
};

