import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import CommentInput from './CommentInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Reply, Share, ChevronDown, ChevronRight } from 'lucide-react';
import { commentService } from '@/services/commentService';
import { Comment } from '@/types';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth?: number;
  activeReplyId?: string;
  onReplyToggle?: (commentId: string | null) => void;
  isCollapsed?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  postId, 
  depth = 0,
  activeReplyId,
  onReplyToggle,
  isCollapsed = false
}) => {
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const queryClient = useQueryClient();

  const isActiveReply = activeReplyId === comment.id;
  const isDeepThread = depth > 2;
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Close reply when another comment's reply is opened
  useEffect(() => {
    if (activeReplyId && activeReplyId !== comment.id) {
      // This comment's reply should be closed
    }
  }, [activeReplyId, comment.id]);

  const handleReplyToggle = useCallback(() => {
    const newActiveId = isActiveReply ? null : comment.id;
    onReplyToggle?.(newActiveId);
  }, [isActiveReply, comment.id, onReplyToggle]);

  const likeMutation = useMutation({
    mutationFn: commentService.toggleCommentLike,
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previousComments = queryClient.getQueryData<Comment[]>(['comments', postId]);
      
      if (previousComments) {
        const updateCommentLikes = (comments: Comment[]): Comment[] => {
          return comments.map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                liked_by_user: !c.liked_by_user,
                likes_count: c.liked_by_user ? c.likes_count - 1 : c.likes_count + 1,
              };
            }
            if (c.replies) {
              return { ...c, replies: updateCommentLikes(c.replies) };
            }
            return c;
          });
        };
        
        queryClient.setQueryData(['comments', postId], updateCommentLikes(previousComments));
      }
      
      return { previousComments };
    },
    onError: (error, commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString();
  };

  // Responsive margin and border adjustments
  const marginClasses = depth > 0 
    ? `ml-4 sm:ml-6 md:ml-8 ${depth > 2 ? 'ml-2 sm:ml-4' : ''}`
    : '';
  
  const borderClasses = depth > 0 
    ? 'border-l-2 border-muted pl-2 sm:pl-4' 
    : '';

  return (
    <div className={`${marginClasses} ${borderClasses} transition-all duration-200`}>
      <div className={`flex gap-2 sm:gap-3 ${isDeepThread ? 'text-sm' : ''}`}>
        {/* Avatar - hide on very deep threads on mobile */}
        <div className={`${depth > 3 ? 'hidden sm:block' : ''} flex-shrink-0`}>
          <Avatar className={`${isDeepThread ? 'h-6 w-6' : 'h-8 w-8'}`}>
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {comment.user?.name.charAt(0)}
            </AvatarFallback>
            {comment.user?.avatar && <AvatarImage src={comment.user.avatar} />}
          </Avatar>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold ${isDeepThread ? 'text-xs' : 'text-sm'} truncate`}>
              {comment.user?.name}
            </span>
            <span className={`${isDeepThread ? 'text-xs' : 'text-xs'} text-muted-foreground flex-shrink-0`}>
              {formatTimeAgo(comment.created_at)}
            </span>
            
            {/* Collapse/expand toggle for threads with replies */}
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-5 w-5 p-0 ml-auto flex-shrink-0"
              >
                {isExpanded ? 
                  <ChevronDown className="h-3 w-3" /> : 
                  <ChevronRight className="h-3 w-3" />
                }
              </Button>
            )}
          </div>
          
          {/* Comment body */}
          {isExpanded && (
            <>
              <p className={`${isDeepThread ? 'text-sm' : 'text-sm'} mb-2 break-words`}>
                {comment.body}
              </p>
              
              {/* Actions */}
              <div className={`flex items-center gap-2 sm:gap-4 ${isDeepThread ? 'text-xs' : 'text-xs'}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => likeMutation.mutate(comment.id)}
                  className={`h-6 px-1 sm:px-2 ${comment.liked_by_user ? 'text-red-500' : ''}`}
                  disabled={likeMutation.isPending}
                >
                  <Heart className={`h-3 w-3 mr-1 ${comment.liked_by_user ? 'fill-current' : ''}`} />
                  <span className={comment.likes_count > 0 ? '' : 'hidden sm:inline'}>
                    {comment.likes_count}
                  </span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReplyToggle}
                  className="h-6 px-1 sm:px-2"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Reply</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="h-6 px-1 sm:px-2">
                  <Share className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>
              
              {/* Reply Input */}
              {isActiveReply && (
                <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                  <CommentInput
                    postId={postId}
                    parentId={comment.id}
                    onSuccess={() => onReplyToggle?.(null)}
                    onCancel={() => onReplyToggle?.(null)}
                    placeholder={`Reply to ${comment.user?.name}...`}
                    autoFocus={true}
                    depth={depth + 1}
                  />
                </div>
              )}
            </>
          )}
          
          {/* Replies */}
          {hasReplies && isExpanded && (
            <div className="mt-3">
              {showReplies ? (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                  {comment.replies!.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      depth={depth + 1}
                      activeReplyId={activeReplyId}
                      onReplyToggle={onReplyToggle}
                    />
                  ))}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(true)}
                  className="text-xs text-muted-foreground p-1"
                >
                  <ChevronRight className="h-3 w-3 mr-1" />
                  Show {comment.replies_count} replies
                </Button>
              )}
            </div>
          )}
          
          {/* Collapsed state indicator */}
          {!isExpanded && hasReplies && (
            <div className="text-xs text-muted-foreground mt-1">
              {comment.replies_count} replies hidden
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CommentItem;