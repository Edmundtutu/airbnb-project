import api from './api';
import { Listing, PaginatedResponse, Review, ApiResponse } from '@/types';

interface GetListingsParams {
  search?: string;
  category?: string;
  page?: number;
  check_in?: string;
  check_out?: string;
  guests?: number;
  property_id?: string;
  min_price?: number;
  max_price?: number;
  amenities?: string[];
}

const apiVersion = import.meta.env.VITE_API_VERSION;

export const listingService = {
  async getListings(params?: GetListingsParams): Promise<PaginatedResponse<Listing>> {
    const formattedParams: any = {};

    if (params?.search) {
      const term = `%${params.search}%`;
      formattedParams['name[like]'] = term;
      formattedParams['description[like]'] = term;
      formattedParams['tags[like]'] = term;
    }

    if (params?.category && params.category !== 'All') {
      formattedParams['category[eq]'] = params.category;
    }

    if (params?.page) {
      formattedParams['page'] = params.page;
    }

    if (params?.check_in) {
      formattedParams['check_in'] = params.check_in;
    }

    if (params?.check_out) {
      formattedParams['check_out'] = params.check_out;
    }

    if (params?.guests) {
      formattedParams['guests'] = params.guests;
    }

    if (params?.property_id) {
      formattedParams['property_id'] = params.property_id;
    }

    if (params?.min_price) {
      formattedParams['min_price'] = params.min_price;
    }

    if (params?.max_price) {
      formattedParams['max_price'] = params.max_price;
    }

    if (params?.amenities && params.amenities.length > 0) {
      formattedParams['amenities'] = params.amenities.join(',');
    }

    const response = await api.get(`${apiVersion}/listings`, { params: formattedParams });
    const payload = response.data;
    if (payload && payload.meta) {
      return {
        data: payload.data ?? [],
        current_page: payload.meta.current_page ?? 1,
        last_page: payload.meta.last_page ?? 1,
        per_page: payload.meta.per_page ?? (payload.data?.length ?? 0),
        total: payload.meta.total ?? (payload.data?.length ?? 0),
      };
    }
    // Fallback for non-paginated arrays
    return {
      data: payload?.data ?? [],
      current_page: 1,
      last_page: 1,
      per_page: payload?.data?.length ?? 0,
      total: payload?.data?.length ?? 0,
    };
  },

  async getListing(id: string): Promise<Listing> {
    const response = await api.get<ApiResponse<Listing>>(`${apiVersion}/listings/${id}`);
    // Most of our services unwrap .data
    return (response.data as any).data ?? (response.data as any);
  },

  async createListing(data: Partial<Listing>): Promise<Listing> {
    const response = await api.post<ApiResponse<Listing>>(`${apiVersion}/listings`, data);
    return response.data.data;
  },

  async updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    const response = await api.put<ApiResponse<Listing>>(`${apiVersion}/listings/${id}`, data);
    return response.data.data;
  },

  async deleteListing(id: string): Promise<void> {
    await api.delete(`${apiVersion}/listings/${id}`);
  },

  async attachCategories(listingId: string, categoryIds: string[]): Promise<Listing> {
    const response = await api.put<ApiResponse<Listing>>(`${apiVersion}/listings/${listingId}`, {
      category_ids: categoryIds,
    });
    return (response.data as any).data ?? (response.data as any);
  },

  async getListingReviews(listingId: string): Promise<Review[]> {
    const response = await api.get(`${apiVersion}/reviews`, {
      params: { listing_id: listingId },
    });
    // Paginator shape
    if ((response.data as any)?.data) {
      return (response.data as any).data;
    }
    return response.data ?? [];
  },

  async checkAvailability(listingId: string, checkIn: string, checkOut: string, guests: number): Promise<{ 
    available: boolean; 
    price_per_night: number; 
    total_price: number;
    total_nights: number;
    cleaning_fee?: number;
    service_fee?: number;
  }> {
    const response = await api.get(`${apiVersion}/listings/${listingId}/availability`, {
      params: { check_in: checkIn, check_out: checkOut, guests },
    });
    return response.data;
  },

  async getListingsByProperty(propertyId: string): Promise<Listing[]> {
    const response = await api.get(`${apiVersion}/listings`, {
      params: { property_id: propertyId },
    });
    if ((response.data as any)?.data) {
      return (response.data as any).data;
    }
    return response.data ?? [];
  },

  async getFeaturedListings(limit?: number): Promise<Listing[]> {
    const response = await api.get(`${apiVersion}/listings/featured`, {
      params: { limit },
    });
    if ((response.data as any)?.data) {
      return (response.data as any).data;
    }
    return response.data ?? [];
  },

  async getNearbyListings(lat: number, lng: number, radius: number = 10): Promise<Listing[]> {
    const response = await api.get(`${apiVersion}/listings/nearby`, {
      params: { lat, lng, radius },
    });
    if ((response.data as any)?.data) {
      return (response.data as any).data;
    }
    return response.data ?? [];
  },
};

// Legacy alias for backward compatibility
export const productService = listingService;