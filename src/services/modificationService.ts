import api from './api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export interface Modification {
  id: string;
  product_id: string;
  name: string;
  cost: number;
}

export const modificationService = {
  async create(productId: string, name: string, cost = 0): Promise<Modification> {
    const res = await api.post(`${apiVersion}/modifications`, {
      product_id: productId,
      name,
      cost,
    });
    return res.data.data as Modification;
  },
};


