import api from './api';
import { Listing, PaginatedResponse, ApiResponse, Review } from '@/types';

const apiVersion: string = (import.meta as any).env?.VITE_API_VERSION || '/api/v1';

export const listingService = {
  async getListings(params?: {
    search?: string;
    category?: string;
    property_id?: number | string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
  }): Promise<PaginatedResponse<Listing>> {
    const query: any = { ...params };
    if (params?.property_id) {
      query.shop_id = params.property_id;
      delete query.property_id;
    }
    const response = await api.get<PaginatedResponse<Listing>>(`${apiVersion}/listings`, { params: query });
    return response.data;
  },

  async getListing(id: string): Promise<Listing> {
    const response = await api.get<ApiResponse<Listing>>(`${apiVersion}/listings/${id}`);
    return (response.data as any).data ?? (response.data as any);
  },

  async attachCategories(listingId: string, categoryIds: string[]): Promise<Listing> {
    const response = await api.put<ApiResponse<Listing>>(`${apiVersion}/listings/${listingId}`, {
      category_ids: categoryIds,
    });
    return (response.data as any).data ?? (response.data as any);
  },

  async getListingReviews(listingId: string): Promise<Review[]> {
    const response = await api.get(`${apiVersion}/reviews`, {
      params: { product_id: listingId },
    });
    if ((response.data as any)?.data) return (response.data as any).data;
    return response.data ?? [];
  },
};

