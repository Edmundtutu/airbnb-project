import api from './api';
import { User, ApiResponse } from '@/types';

const apiVersion = import.meta.env.VITE_API_VERSION;
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: 'customer' | 'vendor';
}

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; access_token: string }> {
    const response = await api.post(`${apiVersion}/login`, { email, password });
    return {
      user: response.data.user,
      access_token: response.data.access_token
    };
  },

  async register(data: RegisterData): Promise<{ user: User; access_token: string }> {
    const response = await api.post(`${apiVersion}/register`, data);
    return {
      user: response.data.user,
      access_token: response.data.access_token
    };
  },

  async logout(): Promise<void> {
    await api.post(`${apiVersion}/logout`);
  },

  async me(): Promise<User> {
    const response = await api.get(`${apiVersion}/user`);
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/forgot-password', { email });
  },

  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await api.post('/reset-password', data);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/user/profile', data);
    return response.data.data;
  },

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await api.put('/user/password', data);
  },
};