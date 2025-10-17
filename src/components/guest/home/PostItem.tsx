import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import {
  Heart,
  MessageCircle,
  Share,
  Star,
  MapPin,
  Package,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { postService } from '@/services/postService';
import { Post } from '@/types';
import CommentSection from './CommentSection';

interface PostItemProps {
  post: Post;
  onCommentToggle?: (postId: string, isOpen: boolean) => void;
  isCommentExpanded?: boolean;
  className?: string;
}

const PostItem: React.FC<PostItemProps> = ({ 
  post, 
  onCommentToggle,
  isCommentExpanded = false,
  className = '' 
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(isCommentExpanded);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Track carousel slide changes
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCurrentImageIndex(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // Sync external comment state
  useEffect(() => {
    setShowComments(isCommentExpanded);
  }, [isCommentExpanded]);

  const handleCommentToggle = useCallback(() => {
    const newState = !showComments;
    setShowComments(newState);
    onCommentToggle?.(post.id, newState);
  }, [showComments, post.id, onCommentToggle]);

  const likeMutation = useMutation({
    mutationFn: postService.togglePostLike,
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData<Post[]>(['posts']);

      if (previousPosts) {
        const newPosts = previousPosts.map(p => {
          if (p.id === postId) {
            const isLiked = p.liked_by_user;
            return {
              ...p,
              liked_by_user: !isLiked,
              likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
            };
          }
          return p;
        });
        queryClient.setQueryData(['posts'], newPosts);
      }

      return { previousPosts };
    },
    onError: (error, postId, context) => {
      console.error('Like mutation failed:', error);
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className={`shadow-sm hover:shadow-md transition-all duration-200 ${className} ${
      showComments ? 'ring-1 ring-primary/20' : ''
    }`}>
      {/* Header */}
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-background">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {post.user?.name.charAt(0)}
              </AvatarFallback>
              {post.user?.avatar && <AvatarImage src={post.user.avatar} />}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm sm:text-base truncate">{post.user?.name}</p>
                {post.user?.verified && (
                  <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-foreground">✓</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>{formatDate(post.created_at)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Public
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 flex-shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 sm:px-6">
        {/* Content */}
        <div className="mb-4">
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        </div>

        {/* Image Carousel with enhanced mobile experience */}
        {post.images && post.images.length > 0 && (
          <div className="mb-4 -mx-3 sm:mx-0">
            <Carousel 
              className="w-full"
              setApi={setCarouselApi}
            >
              <CarouselContent className="ml-0">
                {post.images.map((image, index) => (
                  <CarouselItem key={index} className="pl-0">
                    <div 
                      className={`relative ${
                        isImageExpanded 
                          ? 'aspect-auto max-h-[70vh]' 
                          : 'aspect-square sm:aspect-video max-h-80'
                      } cursor-pointer transition-all duration-300`}
                      onClick={() => setIsImageExpanded(!isImageExpanded)}
                    >
                      <img
                        src={image}
                        alt={`Post Image ${index + 1}`}
                        className="w-full h-full object-cover sm:rounded-lg border-0 sm:border"
                        loading="lazy"
                      />
                      
                      {/* Image overlay controls */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 sm:rounded-lg" />
                      
                      {/* Image counter */}
                      {post.images.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {index + 1} / {post.images.length}
                        </div>
                      )}
                      
                      {/* Expand/collapse indicator */}
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white p-1 rounded-full">
                        {isImageExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Carousel navigation - hidden on mobile for single images */}
              {post.images.length > 1 && (
                <div className="hidden sm:block">
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </div>
              )}
            </Carousel>
            
            {/* Mobile dots indicator for multiple images */}
            {post.images.length > 1 && (
              <div className="flex justify-center mt-2 gap-1 sm:hidden">
                {post.images.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product Card with enhanced responsive design */}
        {post.product && (
          <Link to={`/product/${post.product.id}`} className="block">
            <Card className="mb-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-primary group">
              <CardContent className="p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {post.product.images?.[0] ? (
                      <img
                        src={post.product.images[0]}
                        alt={post.product.name}
                        className="w-full h-full object-cover rounded-md"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="h-6 w-6 sm:h-10 sm:w-10 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {post.product.name}
                    </h4>
                    
                    {post.product.shop?.name && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2">
                        {post.product.shop.name}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {post.product.rating !== undefined && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs sm:text-sm font-medium">
                              {post.product.rating}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {post.product.price !== undefined && (
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm sm:text-lg font-bold text-primary">
                            UGX {post.product.price.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Enhanced Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likeMutation.mutate(post.id)}
            disabled={likeMutation.isPending}
            className={`flex-1 sm:flex-initial transition-all duration-200 ${
              post.liked_by_user 
                ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
                : 'hover:bg-muted'
            } ${likeMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`h-4 w-4 mr-1 sm:mr-2 ${post.liked_by_user ? 'fill-current' : ''}`} />
            <span className="text-xs sm:text-sm">
              {formatNumber(post.likes_count)}
              <span className="hidden sm:inline ml-1">
                {post.likes_count === 1 ? 'Like' : 'Likes'}
              </span>
            </span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleCommentToggle}
            className={`flex-1 sm:flex-initial transition-all duration-200 ${
              showComments 
                ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                : 'hover:bg-muted'
            }`}
          >
            <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">
              {formatNumber(post.comments_count)}
              <span className="hidden sm:inline ml-1">
                {post.comments_count === 1 ? 'Comment' : 'Comments'}
              </span>
            </span>
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${
              showComments ? 'rotate-180' : ''
            }`} />
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            className="flex-1 sm:flex-initial hover:bg-muted transition-colors duration-200"
          >
            <Share className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm hidden sm:inline">Share</span>
          </Button>
        </div>
      </CardContent>

      {/* Enhanced Comment Section Integration */}
      <div className={`transition-all duration-300 ease-in-out ${
        showComments ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <CommentSection
          postId={post.id}
          isOpen={showComments}
          onToggle={handleCommentToggle}
          commentsCount={post.comments_count}
        />
      </div>
    </Card>
  );
};

export default PostItem;