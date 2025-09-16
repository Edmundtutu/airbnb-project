import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  MapPin, 
  Star,
  ShoppingBag,
  Heart,
  Settings,
  Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Review, Product } from '@/types';
import OrderHistory from '@/components/customer/profile/orders/OrderHistory';
import { useFavorites } from '@/context/FavoritesContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  // OrderHandlers are fetched via react-query in OrderHistory component
  const [reviews, setReviews] = useState<Review[]>([]);
  const { favoriteProducts, removeProductFromFavorites } = useFavorites();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user data from API (orders, reviews). Favorites are client-side
    setIsLoading(false);
    // orders handled separately
    setReviews([]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'secondary';
      case 'preparing': return 'default';
      case 'ready': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-2 sm:max-w-4xl sm:mx-auto space-y-4 sm:space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center">
              <User className="h-10 w-10 sm:h-12 sm:w-12 text-primary-foreground" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold">{user?.name}</h1>
              <p className="text-muted-foreground text-sm sm:text-base">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-2">
                <Badge variant={user?.verified ? 'default' : 'secondary'} className="text-xs">
                  {user?.verified ? 'Verified' : 'Unverified'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {user?.role === 'customer' ? 
                    (user?.isInfluencer ? 'Influencer' : 'Customer') : 'Vendor'}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="orders" className="text-xs sm:text-sm px-2 py-2">Orders</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm px-2 py-2">Reviews</TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs sm:text-sm px-2 py-2">Favorites</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 py-2">Settings</TabsTrigger>
        </TabsList>

        {/* OrderHandlers Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>View your past orders and their status.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderHistory />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Reviews</h2>
            <p className="text-muted-foreground">{reviews.length} reviews</p>
          </div>

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">
                  Start reviewing products to help other shoppers
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {review.product?.name || review.shop?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p>{review.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Favorite Products</h2>
            <p className="text-muted-foreground">{favoriteProducts.length} items</p>
          </div>

          {favoriteProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
                <p className="text-muted-foreground">
                  Save products you love to find them easily later
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {favoriteProducts.map((item: Product) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.shop?.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">UGX {item.price.toLocaleString()}</span>
                      <Button size="sm" variant="outline" onClick={() => removeProductFromFavorites(item.id)}>
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <p className="text-sm text-muted-foreground">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <p className="text-sm text-muted-foreground">
                    {user?.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <p className="text-sm text-muted-foreground">
                    {user?.location?.address || 'Not provided'}
                  </p>
                </div>
              </div>
              <Button>Edit Information</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your orders and new products
                  </p>
                </div>
                <Button variant="outline">Manage</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Privacy Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Control who can see your profile and activity
                  </p>
                </div>
                <Button variant="outline">Manage</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;