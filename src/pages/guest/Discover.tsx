import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Star,
  MapPin,
  Heart,
  ShoppingCart,
  SlidersHorizontal
} from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
 import { useQuery } from '@tanstack/react-query';
 import { productService } from '@/services/productService';
 import { useFavorites } from '@/context/FavoritesContext';
 import ProductCard from '@/components/customer/discover/ProductCard';

const Discover: React.FC = () => {
 const [searchParams] = useSearchParams();
 const { addItem } = useCart();
 const { toggleProductFavorite, isProductFavorited } = useFavorites();
 const { toast } = useToast();

 const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
 const [selectedCategory, setSelectedCategory] = useState('');
 const [page, setPage] = useState(1);

  const categories = [
    'All',
    'Electronics',
    'Fashion',
    'Food',
    'Books',
    'Sports',
    'Beauty',
    'Furniture',
    'Accessories'
  ];

  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory, page],
    queryFn: () => productService.getProducts({ search: searchQuery, category: selectedCategory, page }),
    staleTime: 30_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect above
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1, product.shop);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const handleToggleFavorite = (product: Product) => {
    const wasFavorited = isProductFavorited(product.id);
    toggleProductFavorite(product);
    toast({
      title: wasFavorited ? 'Removed from favorites' : 'Added to favorites',
      description: wasFavorited ? 'Product removed from your favorites' : 'Product added to your favorites',
    });
  };

  // Determine products to display
  const productsToDisplay: Product[] = (productsResponse as any)?.data || [];
  const totalProducts = (productsResponse as any)?.total ?? 0;
  const currentPage = (productsResponse as any)?.current_page ?? 1;
  const lastPage = (productsResponse as any)?.last_page ?? 1;

  if (error) {
    return <div className="text-center text-red-500">Error loading products.</div>;
  }

  return (
    <div className="w-full space-y-4 md:space-y-6 px-1 sm:px-0">

      {/* Search Bar - Mobile optimized */}
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <Input
            placeholder="Search for products, brands, or shops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 md:pl-12 h-10 md:h-12 text-sm md:text-base"
          />
        </div>
      </form>

      {/* Categories - Horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category || (category === 'All' && !selectedCategory) ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap text-xs md:text-sm flex-shrink-0"
            onClick={() => setSelectedCategory(category === 'All' ? '' : category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs md:text-sm text-muted-foreground">
          {totalProducts} products found
        </p>
      </div>

      {/* Loading Spinner - Only shows in content area */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Products Grid - Responsive with better large screen handling */}
      {!isLoading && (
        <>
          {productsToDisplay.length === 0 ? (
            <Card>
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  Try adjusting your search terms or browse different categories
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-7xl mx-auto">
              {productsToDisplay.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}

      {!isLoading && lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {currentPage} of {lastPage}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= lastPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Discover;