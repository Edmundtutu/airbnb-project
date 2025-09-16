import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X } from 'lucide-react';
import { commentService } from '@/services/commentService';
import { useAuth } from '@/context/AuthContext';

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  depth?: number;
}

const CommentInput: React.FC<CommentInputProps> = ({
  postId,
  parentId,
  onSuccess,
  onCancel,
  className = '',
  placeholder = 'Write a comment...',
  autoFocus = false,
  depth = 0,
}) => {
  const [comment, setComment] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const createCommentMutation = useMutation({
    mutationFn: (body: string) => commentService.createComment(postId, body, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setComment('');
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      createCommentMutation.mutate(comment.trim());
    }
  };

  // Adjust layout based on depth and screen size
  const isDeepThread = depth > 2;
  const containerClasses = `${className} ${
    isDeepThread ? 'sm:ml-4' : ''
  }`;

  return (
    <div className={containerClasses}>
      <form onSubmit={handleSubmit}>
        <div className={`flex gap-2 ${isDeepThread ? 'sm:gap-3' : 'gap-3'}`}>
          {/* Hide avatar on very deep threads on mobile */}
          <div className={`${isDeepThread ? 'hidden sm:block' : ''}`}>
            <Avatar className={`${isDeepThread ? 'h-6 w-6' : 'h-8 w-8'}`}>
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.name.charAt(0)}
              </AvatarFallback>
              {user?.avatar && <AvatarImage src={user.avatar} />}
            </Avatar>
          </div>
          
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`
                min-h-[50px] resize-none transition-all duration-200
                ${isFocused ? 'min-h-[80px]' : ''}
                ${isDeepThread ? 'text-sm' : ''}
              `}
              disabled={createCommentMutation.isPending}
            />
            
            <div className={`flex justify-end gap-2 mt-2 ${
              isFocused || comment.trim() ? 'opacity-100' : 'opacity-60'
            } transition-opacity duration-200`}>
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size={isDeepThread ? 'sm' : 'sm'}
                  onClick={onCancel}
                  disabled={createCommentMutation.isPending}
                  className="h-7"
                >
                  <X className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
              )}
              
              <Button
                type="submit"
                size={isDeepThread ? 'sm' : 'sm'}
                disabled={!comment.trim() || createCommentMutation.isPending}
                className="h-7"
              >
                <Send className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Post</span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentInput;