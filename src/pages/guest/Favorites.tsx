import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import { ListingCard } from '@/components/guest/discover/ListingCard';

const FavoritesPage: React.FC = () => {
  const { wishlistedListings, removeListingFromFavorites } = useWishlist();

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">My Favorites</h1>
        <p className="text-muted-foreground text-sm md:text-base">Stays you saved for later</p>
      </div>

      {wishlistedListings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
            <p className="text-muted-foreground">Tap the heart icon on stays to add them here.</p>
            <Link to="/">
              <Button className="mt-4">Browse Stays</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {wishlistedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onRemoveWishlist={removeListingFromFavorites}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;


