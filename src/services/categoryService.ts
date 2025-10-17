import api from './api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  description?: string | null;
}

export const categoryService = {
  async list(shopId: string): Promise<Category[]> {
    const res = await api.get(`${apiVersion}/categories`, { params: { shop_id: shopId, per_page: 100 } });
    const payload = res.data;
    return Array.isArray(payload?.data) ? payload.data : (payload ?? []);
  },

  async create(shopId: string, name: string, description?: string): Promise<Category> {
    const res = await api.post(`${apiVersion}/categories`, { shop_id: shopId, name, description });
    return res.data.data;
  },

  async update(id: string, data: Partial<Pick<Category, 'name' | 'description'>>): Promise<Category> {
    const res = await api.put(`${apiVersion}/categories/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`${apiVersion}/categories/${id}`);
  },
};


