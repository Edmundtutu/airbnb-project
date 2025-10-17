import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, MapPin } from 'lucide-react';

interface PostCreationActionsProps {
  imageCount: number;
  onCamera: () => void;
  onUpload: () => void;
  onCancel: () => void;
  onPost: () => void;
  canPost: boolean;
}

const PostCreationActions: React.FC<PostCreationActionsProps> = ({ 
  imageCount, 
  onCamera, 
  onUpload, 
  onCancel, 
  onPost, 
  canPost 
}) => {
  const isMax = imageCount >= 4;

  return (
    <div className="w-full min-w-0">
      {/* Mobile-first: Stack vertically on very small screens */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 sm:pt-3 border-t gap-2 sm:gap-0">
        
        {/* Action buttons - Responsive layout */}
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] sm:text-xs lg:text-sm h-7 sm:h-8 px-2 sm:px-3 flex-shrink-0"
            disabled={isMax}
            onClick={onCamera}
          >
            <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Camera</span>
            <span className="ml-1">({imageCount}/4)</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] sm:text-xs lg:text-sm h-7 sm:h-8 px-2 sm:px-3 flex-shrink-0"
            onClick={onUpload}
            disabled={isMax}
          >
            <ImageIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Upload</span>
            <span className="ml-1">({imageCount}/4)</span>
          </Button>

          {/* Hide Tag Shop on very small screens */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] sm:text-xs lg:text-sm h-7 sm:h-8 px-2 sm:px-3 hidden sm:flex"
          >
            <MapPin className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
            Tag Shop
          </Button>
        </div>

        {/* Control buttons - Always visible */}
        <div className="flex gap-1 sm:gap-2 justify-center sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-[10px] sm:text-xs lg:text-sm h-7 sm:h-8 px-2 sm:px-3 flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={onPost} 
            disabled={!canPost}
            className="text-[10px] sm:text-xs lg:text-sm h-7 sm:h-8 px-2 sm:px-3 flex-1 sm:flex-initial"
          >
            Post
          </Button>
        </div>
      </div>

      {/* Mobile-only Tag Shop button */}
      <div className="mt-2 sm:hidden">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-[10px] h-6 px-2 w-full"
        >
          <MapPin className="h-2.5 w-2.5 mr-1" />
          Tag Shop
        </Button>
      </div>

      {/* Hidden file input for upload functionality */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          // Handle file upload logic here
          // This should be passed down as a prop or handled in parent
        }}
        className="hidden"
        id="photo-upload"
        disabled={isMax}
      />
    </div>
  );
};

export default PostCreationActions;