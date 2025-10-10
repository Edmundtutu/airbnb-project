import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import PostItem from '@/components/guest/feed/PostItem';
import { postService } from '@/services/postService';
import QuickStatsGrid from '@/components/guest/feed/QuickStatsGrid';
import CameraCapture from '@/components/features/CameraCapture';
import { useImageCapture } from '@/hooks/useImageCapture';
import { MessageCircle } from 'lucide-react';
import {TextCarousel} from '@/components/features/TextCarousel';

const Feed: React.FC = () => {
  const { user } = useAuth();
  const imageCapture = useImageCapture();

  const { data: postsData, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: postService.getPosts,
  });

  const handleCameraCapture = (imageData: string) => imageCapture.handleCameraCapture(imageData);
  const handleCameraClose = () => imageCapture.handleCameraClose();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error("Error fetching posts:", error);
    return (
      <div className="text-center text-destructive py-12">Failed to load posts. Please try again later.</div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Header - Facebook-style */}

      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <TextCarousel
              className="flex-1 text-muted-foreground text-sm"
              texts={[
                'Share your travel experience',
                'Nearby properties have amazing stays! Read the reviews',
                'Where are you traveling today?',
                'Where will you stay next?',
                'Join your friends for an adventure',
                'Pictures of your stay will inspire others',
                'Enjoy your travel experience with friends',
                ]}
              interval={4000}
              transitionDuration={300}
            />
          </div>
        </div>
        <div className="border-b border-gray-200"></div>
        <QuickStatsGrid />
      </div>

      {/* Post creation removed per new requirement: must be initiated from OrderHandlers */}
          
      

      {/* Feed */}
      {/* Use postsData directly from useQuery */}
      {!postsData || postsData.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 lg:p-12 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 lg:h-10 lg:w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg lg:text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6 text-sm lg:text-base max-w-md mx-auto">
              Start following other users and shops to see their posts in your feed, or create your first post!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/">Discover Stays</Link>
              </Button>
              {/* Creation moved to Bookings tab; remove CTA from Home */}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {postsData.map((post) => ( // Use postsData here
            <PostItem key={post.id} post={post} /> // Use PostItem component
          ))}
        </div>
      )}

      {/* Full-Page Camera Modal */}
      {imageCapture.showCameraModal && (
        <div className="fixed inset-0 z-50 bg-background">
          <CameraCapture 
            onCapture={handleCameraCapture}
            onClose={handleCameraClose}
          />
        </div>
      )}
    </div>
  );
};

export default Feed;