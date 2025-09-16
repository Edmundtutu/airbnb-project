import api from './api';
import { Property, Listing, Booking, Review, Post, ApiResponse, PaginatedResponse } from '@/types';
import type { LaravelPaginatedResponse } from '@/types/api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export const propertyService = {
  // PropertyHandlers
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
    if (params?.owner_id) {
      formattedParams['owner_id'] = params.owner_id;
    }

    const response = await api.get(`${apiVersion}/shops`, { params: formattedParams });
    const apiData = response.data as LaravelPaginatedResponse<any>;

    const mapApiShopToClient = (s: any): Shop => ({
      id: s.id,
      name: s.name,
      description: s.description ?? '',
      location: { lat: Number(s.lat), lng: Number(s.lng), address: s.address ?? '' },
      avatar: s.avatar ?? undefined,
      cover_image: s.cover_image ?? undefined,
      owner_id: s.owner_id,
      owner: s.owner,
      rating: s.rating ?? 0,
      total_reviews: s.total_reviews ?? 0,
      phone: s.phone ?? undefined,
      hours: s.hours ?? undefined,
      verified: !!s.verified,
      created_at: s.created_at,
      updated_at: s.updated_at,
      ...(s.distance !== undefined ? { distance: Number(s.distance) } : {}),
    });

    return {
      ...apiData,
      data: (apiData.data ?? []).map(mapApiShopToClient),
    };
  },

  async getShop(id: string | number): Promise<Shop> {
    const response = await api.get(`${apiVersion}/shops/${id}`);
    const s = (response.data as ApiResponse<any>).data;
    return {
      id: s.id,
      name: s.name,
      description: s.description ?? '',
      location: { lat: Number(s.lat), lng: Number(s.lng), address: s.address ?? '' },
      avatar: s.avatar ?? undefined,
      cover_image: s.cover_image ?? undefined,
      owner_id: s.owner_id,
      owner: s.owner,
      rating: s.rating ?? 0,
      total_reviews: s.total_reviews ?? 0,
      phone: s.phone ?? undefined,
      hours: s.hours ?? undefined,
      verified: !!s.verified,
      created_at: s.created_at,
      updated_at: s.updated_at,
      ...(s.distance !== undefined ? { distance: Number(s.distance) } : {}),
    };
  },

  async createShop(data: Partial<Shop>): Promise<Shop> {
    const response = await api.post<ApiResponse<Shop>>(`${apiVersion}/shops`, data);
    return response.data.data;
  },

  async updateShop(id: number, data: Partial<Shop>): Promise<Shop> {
    const response = await api.put<ApiResponse<Shop>>(`${apiVersion}/shops/${id}`, data);
    return response.data.data;
  },

  async deleteShop(id: number): Promise<void> {
    await api.delete(`${apiVersion}/shops/${id}`);
  },

  // Products
  async getProducts(params?: {
    search?: string;
    category?: string;
    shop_id?: number;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
  }): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>(`${apiVersion}/products`, { params });
    return response.data;
  },

  async getProduct(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`${apiVersion}/products/${id}`);
    return response.data.data;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>(`${apiVersion}/products`, data);
    return response.data.data;
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`${apiVersion}/products/${id}`, data);
    return response.data.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`${apiVersion}/products/${id}`);
  },

  async getShopProducts(shopId: string | number): Promise<Product[]> {
    const response = await api.get(`${apiVersion}/products`, { params: { shop_id: shopId } });
    // Accept either paginated or plain data
    if ((response.data as any)?.data) {
      return (response.data as any).data;
    }
    return response.data ?? [];
  },

  // OrderHandlers
  async getOrders(params?: {
    status?: string;
    shop_id?: number;
    page?: number;
  }): Promise<PaginatedResponse<Order>> {
    const response = await api.get<PaginatedResponse<Order>>(`${apiVersion}/orders`, { params });
    return response.data;
  },

  async getOrder(id: number): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`${apiVersion}/orders/${id}`);
    return response.data.data;
  },

  async createOrder(data: {
    shop_id: number;
    items: { product_id: number; quantity: number }[];
    delivery_type: 'pickup' | 'delivery';
    delivery_address?: string;
    notes?: string;
  }): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(`${apiVersion}/orders`, data);
    return response.data.data;
  },

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const response = await api.put<ApiResponse<Order>>(`${apiVersion}/orders/${id}/status`, { status });
    return response.data.data;
  },

  // Reviews
  async getReviews(params?: {
    product_id?: number;
    shop_id?: number;
    page?: number;
  }): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>(`${apiVersion}/reviews`, { params });
    return response.data;
  },

  async createReview(data: {
    product_id?: number;
    shop_id?: number;
    rating: number;
    comment?: string;
    images?: string[];
  }): Promise<Review> {
    const response = await api.post<ApiResponse<Review>>(`${apiVersion}/reviews`, data);
    return response.data.data;
  },

  // PostHandlers (Social Feed)
  async getPosts(params?: { page?: number }): Promise<PaginatedResponse<Post>> {
    const response = await api.get<PaginatedResponse<Post>>(`${apiVersion}/posts`, { params });
    return response.data;
  },

  async createPost(data: {
    content: string;
    images?: string[];
    product_id?: number;
    shop_id?: number;
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

  // Cart
  async getCart(): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>(`${apiVersion}/cart`);
    return response.data.data;
  },

  async addToCart(product_id: number, quantity: number): Promise<void> {
    await api.post(`${apiVersion}/cart`, { product_id, quantity });
  },

  async updateCartItem(id: number, quantity: number): Promise<void> {
    await api.put(`${apiVersion}/cart/${id}`, { quantity });
  },

  async removeFromCart(id: number): Promise<void> {
    await api.delete(`${apiVersion}/cart/${id}`);
  },

  async clearCart(): Promise<void> {
    await api.delete(`${apiVersion}/cart`);
  },
};