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

  async checkAvailability(listingId: string, checkIn: string, checkOut: string, guests: number): Promise<{ available: boolean; price_per_night: number; total_price: number }> {
    const response = await api.get(`${apiVersion}/listings/${listingId}/availability`, {
      params: { check_in: checkIn, check_out: checkOut, guests },
    });
    return response.data;
  },
};

// Legacy alias for backward compatibility
export const productService = listingService;