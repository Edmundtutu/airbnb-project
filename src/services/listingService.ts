import api from './api';
import { Listing, ApiResponse, Review } from '@/types';

interface GetListingsParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

const apiVersion = import.meta.env.VITE_API_VERSION;

export const listingService = {
  async getListings(params: GetListingsParams = {}): Promise<{
    data: Listing[];
    total: number;
    current_page: number;
    last_page: number;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params.search) searchParams.append('search', params.search);
    if (params.category) searchParams.append('category', params.category);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<{
      data: Listing[];
      total: number;
      current_page: number;
      last_page: number;
    }>>(`${apiVersion}/listings?${searchParams.toString()}`);
    
    return response.data.data;
  },

  async getListing(id: string): Promise<Listing> {
    const response = await api.get<ApiResponse<Listing>>(`${apiVersion}/listings/${id}`);
    return response.data.data;
  },

  async getHostListings(): Promise<Listing[]> {
    const response = await api.get<{ data: Listing[] }>(`${apiVersion}/host/listings`);
    return response.data.data;
  },

  async createListing(listingData: Partial<Listing>): Promise<Listing> {
    const response = await api.post<ApiResponse<Listing>>(`${apiVersion}/listings`, listingData);
    return response.data.data;
  },

  async updateListing(id: string, listingData: Partial<Listing>): Promise<Listing> {
    const response = await api.put<ApiResponse<Listing>>(`${apiVersion}/listings/${id}`, listingData);
    return response.data.data;
  },

  async deleteListing(id: string): Promise<void> {
    await api.delete(`${apiVersion}/listings/${id}`);
  },

  async getListingReviews(id: string): Promise<Review[]> {
    const response = await api.get<ApiResponse<Review[]>>(`${apiVersion}/listings/${id}/reviews`);
    return response.data.data;
  },
};