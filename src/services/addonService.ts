import api from './api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export interface Addon {
  id: string;
  product_id: string;
  name: string;
  price: number;
}

export const addonService = {
  async create(productId: string, name: string, price = 0): Promise<Addon> {
    const res = await api.post(`${apiVersion}/addons`, {
      product_id: productId,
      name,
      price,
    });
    return res.data.data as Addon;
  },
};


