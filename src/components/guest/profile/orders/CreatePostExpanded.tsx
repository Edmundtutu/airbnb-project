import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/types';
import ImageCarouselPreview from './ImageCarouselPreview';
import PostCreationActions from './PostCreationActions';

interface CreatePostExpandedProps {
  user: User | null;
  content: string;
  onContentChange: (value: string) => void;
  images: string[];
  onRemoveImage: (index: number) => void;
  onCamera: () => void;
  onUpload: () => void;
  onCancel: () => void;
  onPost: () => void;
  isPosting?: boolean;
  setContent?: (value: string) => void; // compat
}

const CreatePostExpanded: React.FC<CreatePostExpandedProps> = ({
  user,
  content,
  onContentChange,
  images,
  onRemoveImage,
  onCamera,
  onUpload,
  onCancel,
  onPost,
  isPosting = false,
}) => {
  return (
    <div className="space-y-2 sm:space-y-3 lg:space-y-4 w-full min-w-0">
      {/* User Header - Compact on small screens */}
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
            {user?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-xs sm:text-sm truncate leading-tight">
            {user?.name}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
            Public
          </p>
        </div>
      </div>

      {/* Textarea - Responsive sizing */}
      <Textarea
        placeholder="Share your thoughts..."
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] border-0 resize-none text-xs sm:text-sm lg:text-base placeholder:text-muted-foreground focus-visible:ring-0 p-2 sm:p-3"
      />

      {/* Image Preview - Responsive */}
      <ImageCarouselPreview
        images={images}
        onRemoveImage={onRemoveImage}
        onAddHashtag={(tag) => onContentChange(`${content} ${tag}`)}
      />

      {/* Actions - Responsive */}
      <PostCreationActions
        imageCount={images.length}
        onCamera={onCamera}
        onUpload={onUpload}
        onCancel={onCancel}
        onPost={onPost}
        canPost={(content.trim().length > 0 || images.length > 0) && !isPosting}
      />
    </div>
  );
};

export default CreatePostExpanded;