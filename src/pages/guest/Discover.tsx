import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { Listing } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { listingService } from '@/services/listingService';
import { useWishlist } from '@/context/WishlistContext';
import { ListingCard } from '@/components/guest/discover/ListingCard';
import FiltersPanel, { FilterState, DEFAULT_FILTER_STATE } from '@/layouts/FiltersPanel';

const Discover: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { addItem } = useBooking();
  const { toggleListingWishlist, isListingWishlisted } = useWishlist();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Active filters that are applied to the main listing query
  const [activeFilters, setActiveFilters] = useState<FilterState>({ ...DEFAULT_FILTER_STATE });
  
  // Preview filters - live updated as user changes filters in panel (before Apply)
  const [previewFilters, setPreviewFilters] = useState<FilterState>({ ...DEFAULT_FILTER_STATE });
  
  // Preview result count (for showing in filter panel)
  const [previewCount, setPreviewCount] = useState<number | undefined>(undefined);

  // Detect mobile screen and manage filter panel state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Keep filters closed by default on both; user toggles open
      setIsFiltersOpen(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Build query params from filters - maps FilterState to backend API params
  const buildQueryParams = useCallback((filters: FilterState, pageNum: number = 1) => {
    const params: Record<string, any> = {
      page: pageNum,
      per_page: 12, // Default items per page
    };

    // Search query
    if (searchQuery && searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    // Property types (categories)
    if (filters.propertyTypes.length > 0) {
      params.propertyTypes = filters.propertyTypes;
    }

    // Room counts
    if (filters.bedrooms !== null) {
      params.bedrooms = filters.bedrooms;
    }
    if (filters.beds !== null) {
      params.beds = filters.beds;
    }
    if (filters.bathrooms !== null) {
      params.bathrooms = filters.bathrooms;
    }

    // Price range
    if (filters.priceRange[0] > 0) {
      params.minPrice = filters.priceRange[0];
    }
    if (filters.priceRange[1] < 1000000) {
      params.maxPrice = filters.priceRange[1];
    }

    // Amenities (JSON array filter)
    if (filters.amenities.length > 0) {
      params.amenities = filters.amenities;
    }

    // House rules (JSON array filter)
    if (filters.houseRules.length > 0) {
      params.house_rules = filters.houseRules;
    }

    // Accessibility features (JSON array filter)
    if (filters.accessibility.length > 0) {
      params.accessibility = filters.accessibility;
    }

    // Booking options - map to individual boolean params
    if (filters.bookingOptions.includes('instantBook')) {
      params.instant_book = true;
    }
    if (filters.bookingOptions.includes('selfCheckIn')) {
      params.self_check_in = true;
    }
    if (filters.bookingOptions.includes('allowsPets')) {
      params.allows_pets = true;
    }

    return params;
  }, [searchQuery]);

  // Main listings query - uses activeFilters (applied filters)
  const { data: listingsResponse, isLoading, error } = useQuery({
    queryKey: ['listings', searchQuery, activeFilters, page],
    queryFn: () => listingService.getListings(buildQueryParams(activeFilters, page)),
    staleTime: 30_000,
  });

  // Preview query - triggered when filters change in the panel (before Apply)
  // Only runs when the filter panel is open
  const { data: previewResponse, isFetching: isPreviewFetching } = useQuery({
    queryKey: ['listings-preview', searchQuery, previewFilters],
    queryFn: () => listingService.getListings(buildQueryParams(previewFilters, 1)),
    staleTime: 10_000,
    enabled: isFiltersOpen, // Only fetch when filter panel is open
  });

  // Update preview count when preview response changes
  useEffect(() => {
    if (previewResponse) {
      if (Array.isArray(previewResponse)) {
        setPreviewCount(previewResponse.length);
      } else if (typeof previewResponse === 'object') {
        setPreviewCount((previewResponse as any)?.total ?? (previewResponse as any)?.data?.length ?? 0);
      }
    }
  }, [previewResponse]);

  // Sync preview filters when panel opens
  useEffect(() => {
    if (isFiltersOpen) {
      setPreviewFilters({ ...activeFilters });
    }
  }, [isFiltersOpen, activeFilters]);

  // Handle live filter changes (triggered by FiltersPanel onFilterChange)
  const handleFilterChange = useCallback((filters: FilterState) => {
    setPreviewFilters(filters);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleApplyFilters = useCallback((filters: FilterState) => {
    setActiveFilters(filters);
    setPage(1);
    setIsFiltersOpen(false);
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({ ...DEFAULT_FILTER_STATE });
    setPreviewFilters({ ...DEFAULT_FILTER_STATE });
    setPage(1);
  }, []);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.propertyTypes.length > 0) count += activeFilters.propertyTypes.length;
    if (activeFilters.bedrooms !== null) count++;
    if (activeFilters.beds !== null) count++;
    if (activeFilters.bathrooms !== null) count++;
    if (activeFilters.amenities.length > 0) count += activeFilters.amenities.length;
    if (activeFilters.bookingOptions.length > 0) count += activeFilters.bookingOptions.length;
    if (activeFilters.houseRules.length > 0) count += activeFilters.houseRules.length;
    if (activeFilters.accessibility.length > 0) count += activeFilters.accessibility.length;
    if (activeFilters.priceRange[0] > 0 || activeFilters.priceRange[1] < 1000000) count++;
    return count;
  };

  // Normalize listings response
  let listingsToDisplay: Listing[] = [];
  let totalListings = 0;
  let currentPage = 1;
  let lastPage = 1;
  let perPage = 12;

  if (Array.isArray(listingsResponse)) {
    listingsToDisplay = listingsResponse as Listing[];
    totalListings = listingsToDisplay.length;
    currentPage = page;
    lastPage = 1;
  } else if (listingsResponse && typeof listingsResponse === 'object') {
    listingsToDisplay = (listingsResponse as any)?.data || [];
    totalListings = (listingsResponse as any)?.total ?? listingsToDisplay.length;
    currentPage = (listingsResponse as any)?.current_page ?? page;
    lastPage = (listingsResponse as any)?.last_page ?? 1;
    perPage = (listingsResponse as any)?.per_page ?? 12;
  }

  if (error) {
    return <div className="text-center text-red-500">Error loading listings.</div>;
  }

  return (
    <div className="w-full">
      {/* Main Content Area */}
      <div className="lg:flex lg:gap-6">
        {/* Left: Listings */}
        <div className={`flex-1 space-y-4 md:space-y-6 px-1 sm:px-0 ${!isMobile && isFiltersOpen ? 'lg:pr-6' : ''}`}>
          {/* Search Bar with Filter Button */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for stays, locations, or properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 md:pl-12 h-10 md:h-12 text-sm md:text-base"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 md:h-12 md:w-12 relative flex-shrink-0"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                <SlidersHorizontal className="h-4 w-4 md:h-5 md:w-5" />
                {getActiveFiltersCount() > 0 && (
                  <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    variant="destructive"
                  >
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </form>

          {/* Active Filters Summary */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {activeFilters.propertyTypes.map(type => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
              {activeFilters.bedrooms && (
                <Badge variant="secondary">
                  {activeFilters.bedrooms}+ bedrooms
                </Badge>
              )}
              {activeFilters.amenities.length > 0 && (
                <Badge variant="secondary">
                  {activeFilters.amenities.length} amenities
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-xs md:text-sm text-muted-foreground">
              {totalListings} stays found
            </p>
          </div>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Listings Grid */}
          {!isLoading && (
            <>
              {listingsToDisplay.length === 0 ? (
                <Card>
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No stays found</h3>
                    <p className="text-muted-foreground mb-4 text-sm md:text-base">
                      Try adjusting your search terms or filters
                    </p>
                    <Button onClick={() => {
                      setSearchQuery('');
                      clearAllFilters();
                    }}>
                      Clear Search & Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div
                  className={
                    `grid grid-cols-1 sm:grid-cols-2 ` +
                    (
                      (!isMobile && isFiltersOpen)
                        ? `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
                        : `md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
                    ) +
                    ` gap-3 sm:gap-4 lg:gap-6`
                  }
                >
                  {listingsToDisplay.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {!isLoading && lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {lastPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Right: Filters Panel (Desktop Only) */}
        {!isMobile && isFiltersOpen && (
          <div className="hidden lg:block lg:w-96 xl:w-[420px] flex-shrink-0">
            <FiltersPanel
              isOpen={isFiltersOpen}
              onClose={() => setIsFiltersOpen(false)}
              onApplyFilters={handleApplyFilters}
              onFilterChange={handleFilterChange}
              initialFilters={activeFilters}
              resultCount={previewCount}
              isMobile={false}
            />
          </div>
        )}
      </div>  

      {/* Mobile Filters Modal */}
      {isMobile && (
        <FiltersPanel
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          onApplyFilters={handleApplyFilters}
          onFilterChange={handleFilterChange}
          initialFilters={activeFilters}
          resultCount={previewCount}
          isMobile={true}
        />
      )}
    </div>
  );
};

export default Discover;