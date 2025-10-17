import api from './api';
import { Post, ApiResponse } from '@/types';

/**
 * Data structure for creating a new post.
 */
interface CreatePostData {
  content: string;
  images?: (File | string)[];
  productId?: string;
  shopId?: string;
}

/**
 * Utility function to convert base64 image to File object
 */
const base64ToFile = (base64String: string, filename: string = 'image.jpg'): File => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

const apiVersion = import.meta.env.VITE_API_VERSION;

export const postService = {
  /**
   * Fetches a list of posts from the backend API.
   * @returns A promise that resolves with an array of Post objects.
   */
  async getPosts(): Promise<Post[]> {
    const response = await api.get<ApiResponse<Post[]>>(`${apiVersion}/posts`);
    return response.data.data;
  },

  /**
   * Toggles the like status for a specific post.
   * @param postId The ID of the post to like or unlike.
   * @returns A promise that resolves with the updated like count.
   */
  async togglePostLike(postId: string): Promise<{ likes_count: number }> {
    const response = await api.post(`${apiVersion}/posts/${postId}/like`);
    return response.data;
  },

  /**
   * Creates a new post.
   * @param postData The data for the new post, including content and optional images, product, and shop.
   * @returns A promise that resolves with the newly created Post object.
   */
  async createPost(postData: CreatePostData): Promise<Post> {
    const formData = new FormData();
    formData.append('content', postData.content);

    if (postData.images) {
      postData.images.forEach((image, index) => {
        // Handle both File objects and base64 strings
        if (image instanceof File) {
          formData.append('images[]', image);
        } else if (typeof image === 'string' && image.startsWith('data:')) {
          // Convert base64 to File
          const file = base64ToFile(image, `image_${index}.jpg`);
          formData.append('images[]', file);
        }
      });
    }

    if (postData.productId) {
      formData.append('product_id', postData.productId);
    }

    if (postData.shopId) {
      formData.append('shop_id', postData.shopId);
    }

    const response = await api.post<ApiResponse<Post>>(`${apiVersion}/posts`, formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
    return response.data.data;
  },
};