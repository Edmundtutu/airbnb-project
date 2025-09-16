import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import { MessageCircle, ChevronUp } from 'lucide-react';
import { commentService } from '@/services/commentService';
import { Comment } from '@/types';

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onToggle: () => void;
  commentsCount?: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  isOpen, 
  onToggle, 
  commentsCount = 0 
}) => {
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentService.getComments(postId),
    enabled: isOpen,
  });

  const handleReplyToggle = useCallback((commentId: string | null) => {
    setActiveReplyId(commentId);
  }, []);

  if (!isOpen) {
    return (
      <div className="border-t">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full justify-center py-3 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {commentsCount > 0 ? `View ${commentsCount} comments` : 'Add comment'}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b">
        <span className="font-semibold text-sm">
          {comments.length > 0 ? `${comments.length} Comments` : 'Comments'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 sm:p-4">
        {/* Main Comment Input */}
        <div className="mb-4">
          <CommentInput
            postId={postId}
            placeholder="Write a comment..."
            onSuccess={() => setActiveReplyId(null)}
          />
        </div>

        {/* Comments List */}
        <div className="space-y-4 max-h-96 sm:max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <div key={comment.id} className={index > 0 ? 'border-t pt-4' : ''}>
                <CommentItem 
                  comment={comment} 
                  postId={postId}
                  activeReplyId={activeReplyId}
                  onReplyToggle={handleReplyToggle}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;