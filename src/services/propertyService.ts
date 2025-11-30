import api from './api';
import { Property, Listing, Booking, Review, Post, ApiResponse, PaginatedResponse } from '@/types';
import type { LaravelPaginatedResponse } from '@/types/api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export const propertyService = {
  // Property Management
  async getProperties(params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    search?: string;
    category?: string;
    host_id?: string | number;
    page?: number;
  }): Promise<LaravelPaginatedResponse<Property>> {
    const formattedParams: any = {};

    // unified search param that backend groups with OR
    if (params?.search) {
      formattedParams['search'] = params.search;
    }
    if (params?.lat != null && params?.lng != null && params.radius != null) {
      formattedParams['lat'] = params.lat;
      formattedParams['lng'] = params.lng;
      formattedParams['radius'] = params.radius;
    }
    if (params?.category && params.category !== 'all') {
      formattedParams['category'] = params.category;
    }
    if (params?.page) {
      formattedParams['page'] = params.page;
    }
    if (params?.host_id) {
      formattedParams['host_id'] = params.host_id;
    }

    const response = await api.get(`${apiVersion}/properties`, { params: formattedParams });
    const apiData = response.data as LaravelPaginatedResponse<any>;

    const mapApiPropertyToClient = (p: any): Property => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      location: { lat: Number(p.lat), lng: Number(p.lng), address: p.address ?? '' },
      avatar: p.avatar ?? undefined,
      cover_image: p.cover_image ?? undefined,
      host_id: p.host_id,
      host: p.host,
      rating: p.rating ?? 0,
      total_reviews: p.total_reviews ?? 0,
      phone: p.phone ?? undefined,
      hours: p.hours ?? undefined,
      verified: !!p.verified,
      created_at: p.created_at,
      updated_at: p.updated_at,
      ...(p.distance !== undefined ? { distance: Number(p.distance) } : {}),
    });

    return {
      ...apiData,
      data: (apiData.data ?? []).map(mapApiPropertyToClient),
    };
  },

  async getProperty(id: string | number): Promise<Property> {
    const response = await api.get(`${apiVersion}/properties/${id}`);
    const p = (response.data as ApiResponse<any>).data;
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      location: { lat: Number(p.lat), lng: Number(p.lng), address: p.address ?? '' },
      avatar: p.avatar ?? undefined,
      cover_image: p.cover_image ?? undefined,
      host_id: p.host_id,
      host: p.host,
      rating: p.rating ?? 0,
      total_reviews: p.total_reviews ?? 0,
      phone: p.phone ?? undefined,
      hours: p.hours ?? undefined,
      verified: !!p.verified,
      created_at: p.created_at,
      updated_at: p.updated_at,
      ...(p.distance !== undefined ? { distance: Number(p.distance) } : {}),
    };
  },

  async createProperty(data: Partial<Property>): Promise<Property> {
    const response = await api.post<ApiResponse<Property>>(`${apiVersion}/properties`, data);
    return response.data.data;
  },

  async updateProperty(id: number, data: Partial<Property>): Promise<Property> {
    const response = await api.put<ApiResponse<Property>>(`${apiVersion}/properties/${id}`, data);
    return response.data.data;
  },

  async deleteProperty(id: number): Promise<void> {
    await api.delete(`${apiVersion}/properties/${id}`);
  },

  /**
   * Get properties owned by the authenticated host.
   * This is a secure endpoint - the backend determines ownership from the auth session.
   */
  async getHostProperties(params?: { search?: string; page?: number }): Promise<LaravelPaginatedResponse<Property>> {
    const response = await api.get(`${apiVersion}/host/properties`, { params });
    const apiData = response.data as LaravelPaginatedResponse<any>;

    const mapApiPropertyToClient = (p: any): Property => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      location: { lat: Number(p.lat), lng: Number(p.lng), address: p.address ?? '' },
      avatar: p.avatar ?? undefined,
      cover_image: p.cover_image ?? undefined,
      host_id: p.host_id,
      host: p.host,
      rating: p.rating ?? 0,
      total_reviews: p.total_reviews ?? 0,
      phone: p.phone ?? undefined,
      hours: p.hours ?? undefined,
      verified: !!p.verified,
      created_at: p.created_at,
      updated_at: p.updated_at,
    });

    return {
      ...apiData,
      data: (apiData.data ?? []).map(mapApiPropertyToClient),
    };
  },

  // Listings Management
  async getPropertyListings(propertyId: string | number): Promise<Listing[]> {
    const response = await api.get(`${apiVersion}/listings`, { params: { property_id: propertyId } });
    // Accept either paginated or plain data
    if ((response.data as any)?.data) {
      return (response.data as any).data;
    }
    return response.data ?? [];
  },

  // Reviews
  async getPropertyReviews(params?: {
    listing_id?: number;
    property_id?: number;
    page?: number;
  }): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>(`${apiVersion}/reviews`, { params });
    return response.data;
  },

  async createReview(data: {
    listing_id?: number;
    property_id?: number;
    booking_id?: number;
    rating: number;
    comment?: string;
    images?: string[];
  }): Promise<Review> {
    const response = await api.post<ApiResponse<Review>>(`${apiVersion}/reviews`, data);
    return response.data.data;
  },

  // Social Feed (Posts)
  async getPosts(params?: { page?: number; property_id?: number }): Promise<PaginatedResponse<Post>> {
    const response = await api.get<PaginatedResponse<Post>>(`${apiVersion}/posts`, { params });
    return response.data;
  },

  async createPost(data: {
    content: string;
    images?: string[];
    listing_id?: number;
    property_id?: number;
  }): Promise<Post> {
    const response = await api.post<ApiResponse<Post>>(`${apiVersion}/posts`, data);
    return response.data.data;
  },

  async likePost(id: number): Promise<void> {
    await api.post(`${apiVersion}/posts/${id}/like`);
  },

  async unlikePost(id: number): Promise<void> {
    await api.delete(`${apiVersion}/posts/${id}/like`);
  },
};

// Legacy alias for backward compatibility
export const shopService = propertyService;