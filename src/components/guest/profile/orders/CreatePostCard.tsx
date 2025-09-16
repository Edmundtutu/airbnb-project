import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useCreatePost, type UseCreatePostOptions } from '@/hooks/useCreatePost';
import { type UseImageCaptureResult } from '@/hooks/useImageCapture';
import { useAuth } from '@/context/AuthContext';
import CreatePostCollapsed from './CreatePostCollapsed';
import CreatePostExpanded from './CreatePostExpanded';

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
              onChange={imageCapture.handleFileUpload}
              className="hidden"
              disabled={imageCapture.capturedImages.length >= 4}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatePostCard;


