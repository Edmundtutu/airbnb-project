import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useCreatePost, type UseCreatePostOptions } from '@/hooks/useCreatePost';
import { type UseImageCaptureResult } from '@/hooks/useImageCapture';
import { useAuth } from '@/context/AuthContext';
import CreatePostCollapsed from '../orders/CreatePostCollapsed';
import CreatePostExpanded from '../orders/CreatePostExpanded';

interface CreatePostCardProps {
  imageCapture: UseImageCaptureResult;
  createContext?: UseCreatePostOptions;
  forceExpanded?: boolean;
}

const CreatePostCard: React.FC<CreatePostCardProps> = ({ imageCapture: sharedImageCapture, createContext, forceExpanded = false }) => {
  const { user } = useAuth();
  const {
    newPostContent,
    setNewPostContent,
    showCreatePost,
    setShowCreatePost,
    handleCreatePost,
    handleCloseCreatePost,
    isPosting,
    imageCapture,
  } = useCreatePost(sharedImageCapture, createContext);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        {!(forceExpanded || showCreatePost) ? (
          <CreatePostCollapsed user={user} onExpand={() => setShowCreatePost(true)} />
        ) : (
          <>
            <CreatePostExpanded
              user={user}
              content={newPostContent}
              onContentChange={setNewPostContent}
              images={imageCapture.capturedImages}
              onRemoveImage={imageCapture.removeImage}
              onCamera={() => imageCapture.setShowCameraModal(true)}
              onUpload={() => fileInputRef.current?.click()}
              onCancel={handleCloseCreatePost}
              onPost={handleCreatePost}
              isPosting={isPosting}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result as string;
                    if (result) {
                      imageCapture.addImage(result);
                    }
                  };
                  reader.readAsDataURL(file);
                });
                e.target.value = '';
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatePostCard;