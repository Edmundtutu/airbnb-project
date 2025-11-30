import api from './api';
import { Listing, ApiResponse, Review } from '@/types';

interface GetListingsParams {
  // Search
  search?: string;
  
  // Category/Property Type
  category?: string;
  propertyTypes?: string[];  // Multiple property types
  
  // Pagination
  page?: number;
  per_page?: number;
  limit?: number;
  
  // Price range
  minPrice?: number;
  maxPrice?: number;
  
  // Room counts
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  max_guests?: number;
  
  // JSON array filters (comma-separated or array)
  amenities?: string[] | string;
  house_rules?: string[] | string;
  accessibility?: string[] | string;
  
  // Booking options (booleans)
  instant_book?: boolean;
  self_check_in?: boolean;
  allows_pets?: boolean;
  
  // Status
  is_active?: boolean;
}

const apiVersion = import.meta.env.VITE_API_VERSION;

export const listingService = {
  async getListings(params: GetListingsParams = {}): Promise<{
    data: Listing[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  }> {
    const searchParams = new URLSearchParams();
    
    // Search term
    if (params.search) searchParams.append('search', params.search);
    
    // Category - single or multiple via 'in' operator
    if (params.category) {
      searchParams.append('category[eq]', params.category);
    } else if (params.propertyTypes && params.propertyTypes.length > 0) {
      searchParams.append('category[in]', params.propertyTypes.join(','));
    }
    
    // Pagination
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params.limit) searchParams.append('per_page', params.limit.toString());
    
    // Price range - using simple aliases
    if (params.minPrice !== undefined && params.minPrice > 0) {
      searchParams.append('minPrice', params.minPrice.toString());
    }
    if (params.maxPrice !== undefined && params.maxPrice < 1000000) {
      searchParams.append('maxPrice', params.maxPrice.toString());
    }
    
    // Room counts - using gte (greater than or equal) for "X+ bedrooms" style filtering
    if (params.bedrooms !== undefined && params.bedrooms !== null) {
      searchParams.append('bedrooms[gte]', params.bedrooms.toString());
    }
    if (params.beds !== undefined && params.beds !== null) {
      searchParams.append('beds[gte]', params.beds.toString());
    }
    if (params.bathrooms !== undefined && params.bathrooms !== null) {
      searchParams.append('bathrooms[gte]', params.bathrooms.toString());
    }
    if (params.max_guests !== undefined && params.max_guests !== null) {
      searchParams.append('max_guests[gte]', params.max_guests.toString());
    }
    
    // JSON array filters - send as comma-separated string
    if (params.amenities) {
      const amenitiesStr = Array.isArray(params.amenities) 
        ? params.amenities.join(',') 
        : params.amenities;
      if (amenitiesStr) searchParams.append('amenities', amenitiesStr);
    }
    if (params.house_rules) {
      const rulesStr = Array.isArray(params.house_rules) 
        ? params.house_rules.join(',') 
        : params.house_rules;
      if (rulesStr) searchParams.append('house_rules', rulesStr);
    }
    if (params.accessibility) {
      const accessStr = Array.isArray(params.accessibility) 
        ? params.accessibility.join(',') 
        : params.accessibility;
      if (accessStr) searchParams.append('accessibility', accessStr);
    }
    
    // Boolean booking options
    if (params.instant_book === true) {
      searchParams.append('instant_book[eq]', 'true');
    }
    if (params.self_check_in === true) {
      searchParams.append('self_check_in[eq]', 'true');
    }
    if (params.allows_pets === true) {
      searchParams.append('allows_pets[eq]', 'true');
    }
    
    // Only show active listings by default (guests should only see active)
    if (params.is_active !== false) {
      searchParams.append('is_active[eq]', 'true');
    }

    // api does NOT unwrap response.data - axios returns { data: {...}, status, headers, ... }
    const response = await api.get<{
      data: Listing[];
      total: number;
      current_page: number;
      last_page: number;
      per_page: number;
    }>(`${apiVersion}/listings?${searchParams.toString()}`);
    
    // Return response.data which is the Laravel pagination object
    return response.data;
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