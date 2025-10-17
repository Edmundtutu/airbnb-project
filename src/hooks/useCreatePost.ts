import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/postService';
import { useImageCapture, type UseImageCaptureResult } from '@/hooks/useImageCapture';

export interface UseCreatePostResult {
  newPostContent: string;
  setNewPostContent: (value: string) => void;
  showCreatePost: boolean;
  setShowCreatePost: (value: boolean) => void;
  handleCreatePost: () => void;
  handleCloseCreatePost: () => void;
  isPosting: boolean;
  imageCapture: ReturnType<typeof useImageCapture>;
}

export interface UseCreatePostOptions {
  shopId?: string;
  productId?: string;
  onSuccess?: () => void;
}

/**
 * Encapsulates the create-post flow and integrates image capture utilities.
 */
export const useCreatePost = (
  providedImageCapture?: UseImageCaptureResult,
  options?: UseCreatePostOptions
): UseCreatePostResult => {
  const queryClient = useQueryClient();
  const imageCapture = providedImageCapture ?? useImageCapture();
  const context = useMemo(() => options ?? {}, [options]);

  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: (data: { content: string; images?: string[] }) =>
      postService.createPost({ 
        content: data.content, 
        images: data.images,
        shopId: context.shopId,
        productId: context.productId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setNewPostContent('');
      imageCapture.setShowCameraModal(false);
      imageCapture.clearImages();
      setShowCreatePost(false);
      options?.onSuccess?.();
    },
    onError: (error) => {
      // surface error for caller to handle toasts if needed
      console.error('Failed to create post:', error);
    },
  });

  const handleCreatePost = useCallback(() => {
    const content = newPostContent.trim();
    const images = imageCapture.capturedImages;
    if (!content && images.length === 0) return;

    createPostMutation.mutate({ content: newPostContent, images });
  }, [createPostMutation, newPostContent, imageCapture.capturedImages]);

  const handleCloseCreatePost = useCallback(() => {
    setShowCreatePost(false);
    setNewPostContent('');
    imageCapture.setShowCameraModal(false);
    imageCapture.clearImages();
  }, [imageCapture]);

  return {
    newPostContent,
    setNewPostContent,
    showCreatePost,
    setShowCreatePost,
    handleCreatePost,
    handleCloseCreatePost,
    isPosting: createPostMutation.isPending,
    imageCapture,
  };
};


