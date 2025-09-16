import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  MapPin, 
  Share,
  Plus,
  Minus
} from 'lucide-react';
import { Product, Review } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { useFavorites } from '@/context/FavoritesContext';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { isProductFavorited, toggleProductFavorite } = useFavorites();
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: productData, isLoading: loadingProduct } = useQuery({
    enabled: !!id,
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id as string),
    staleTime: 30_000,
  });

  const { data: productReviews, isLoading: loadingReviews } = useQuery({
    enabled: !!id,
    queryKey: ['productReviews', id],
    queryFn: () => productService.getProductReviews(id as string),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (productData) {
      setProduct(productData as Product);
    }
  }, [productData]);

  useEffect(() => {
    if (productReviews) {
      setReviews(productReviews as Review[]);
    }
  }, [productReviews]);

  useEffect(() => {
    setIsLoading(loadingProduct || loadingReviews);
  }, [loadingProduct, loadingReviews]);

  const handleAddToCart = () => {
    // TODO: Add to cart via API
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleProductFavorite(product);
  };

  const handleSubmitReview = () => {
    // TODO: Submit review via API
    setNewReview({ rating: 5, comment: '' });
    setShowReviewForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-medium mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/discover">Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-6xl">📦</div>
            )}
          </div>
          {product.images?.length ? (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer">
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <Link to={`/shops/${product.shop.id}`} className="text-primary hover:underline">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {product.shop.name}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= product.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium">{product.rating}</span>
              <span className="text-muted-foreground">
                ({product.total_reviews} reviews)
              </span>
            </div>
          </div>

          <div className="text-3xl font-bold">UGX {product.price.toLocaleString()}</div>

          {product.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant={product.stock > 10 ? 'default' : 'destructive'}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Badge>
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button variant="outline" size="lg" onClick={handleToggleFavorite}>
              <Heart className={`h-5 w-5 ${product && isProductFavorited(product.id) ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="lg">
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reviews</h2>
          <Button onClick={() => setShowReviewForm(!showReviewForm)}>
            Write a Review
          </Button>
        </div>

        {showReviewForm && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${
                          star <= newReview.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea
                    placeholder="Share your experience with this product..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview}>Submit Review</Button>
                  <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">
                Be the first to review this product!
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
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {review.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{review.user.name}</p>
                        <div className="flex items-center gap-2">
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
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {review.comment && <p>{review.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;