import api from './api';
import type { ApiResponse } from '@/types/api';

const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  size: number;
}

const uploadService = {
  /**
   * Upload dish images
   * @param files Array of File objects to upload
   * @returns Promise with array of uploaded file metadata
   */
  async uploadPropertyImages(files: File[]): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('images[]', file);
    });

    const response = await api.post<ApiResponse<UploadedFile[]>>(
      `/${apiVersion}/uploads/property-images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const payload = response.data?.data;
    if (payload && Array.isArray(payload)) {
      return payload;
    }
    throw new Error(response.data?.message || 'Failed to upload images');
  },
};

export default uploadService;

