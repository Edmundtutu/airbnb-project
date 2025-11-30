import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Home,
  MapPin,
  Users,
  Coins,
  Calendar as CalendarIcon,
  Eye,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Grid,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { listingService } from '@/services/listingService';
import { bookingService } from '@/services/bookingService';
import { useToast } from '@/hooks/use-toast';
import type { Listing } from '@/types';
import type { HostListingReservation } from '@/types/bookings';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type CalendarReservation = HostListingReservation & {
  startDate: Date;
  endDate: Date;
};

const formatUGX = (value: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(value);

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  return { daysInMonth, startingDayOfWeek, year, month };
};

const HostListings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const listingRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (listingId: string) => listingService.deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });
      toast({
        title: 'Listing deleted',
        description: 'Your listing has been permanently deleted.',
      });
      setIsDeleteDialogOpen(false);
      setListingToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error?.response?.data?.message || 'Failed to delete listing. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteClick = (listing: Listing, event: React.MouseEvent) => {
    event.stopPropagation();
    setListingToDelete(listing);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (listingToDelete) {
      deleteMutation.mutate(listingToDelete.id);
    }
  };

  const { data: listings = [], isLoading: isLoadingListings } = useQuery<Listing[]>({
    queryKey: ['hostListings'],
    queryFn: listingService.getHostListings,
  });

  const { data: hostReservations = [], isLoading: isLoadingReservations } = useQuery<HostListingReservation[]>({
    queryKey: ['hostListingReservations', currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: () =>
      bookingService.getHostListingReservations({
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear(),
      }),
  });

  const reservations = useMemo<CalendarReservation[]>(
    () =>
      hostReservations.map((reservation) => ({
        ...reservation,
        startDate: new Date(reservation.check_in_date),
        endDate: new Date(reservation.check_out_date),
      })),
    [hostReservations]
  );

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!selectedListing && listings.length > 0) {
      setSelectedListing(listings[0].id);
    }
  }, [listings, selectedListing]);

  const getReservationsForDay = useCallback(
    (date: Date) => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return reservations.filter(
        (res) => checkDate >= res.startDate && checkDate <= res.endDate
      );
    },
    [reservations]
  );

  const getListingReservationsForDay = useCallback(
    (listingId: string | null, date: Date) => {
      if (!listingId) return [];
      return getReservationsForDay(date).filter((res) => res.listing_id === listingId);
    },
    [getReservationsForDay]
  );

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const scrollToListing = (listingId: string) => {
    const element = listingRefs.current[listingId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  const handleDayClick = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const dayReservations = getReservationsForDay(date);
    if (dayReservations.length > 0) {
      const firstReservation = dayReservations[0];
      setSelectedListing(firstReservation.listing_id);
      scrollToListing(firstReservation.listing_id);
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const activePropertyCount = useMemo(() => {
    const uniqueProperties = new Set(listings.map((listing) => listing.property_id));
    return uniqueProperties.size;
  }, [listings]);

  const isEmptyState = !isLoadingListings && listings.length === 0;

  const CalendarComponent = ({ compact = false }: { compact?: boolean }) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <div className={`bg-card rounded-lg ${compact ? 'p-3' : 'p-6'} border`}>
        {!compact && (
          <div className="flex flex-col items-start gap-2 mb-6">
            <h3 className="font-semibold text-lg text-foreground">Reservations Calendar</h3>
            <div className="flex items-center gap-auto justify-between w-full">
              <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-foreground min-w-[120px] text-center text-sm">
                {monthNames[month]} {year}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-7 gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          {days.map((dayLabel, idx) => (
            <div
              key={`day-${idx}`}
              className={`text-center font-semibold text-muted-foreground ${compact ? 'py-1' : 'py-2'}`}
            >
              {dayLabel}
            </div>
          ))}

          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const date = new Date(year, month, day);
            const dayReservations = getReservationsForDay(date);
            const hasReservation = dayReservations.length > 0;
            const today = isToday(day, month, year);
            const isSelected = selectedListing
              ? getListingReservationsForDay(selectedListing, date).length > 0
              : false;

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day, month, year)}
                className={`
                  aspect-square rounded-full flex items-center justify-center transition-all
                  hover:scale-105 hover:shadow-md
                  ${hasReservation
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-accent'}
                  ${today ? 'ring-2 ring-primary ring-offset-1' : ''}
                  ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                  ${compact ? 'text-xs' : 'text-sm'}
                `}
                title={hasReservation
                  ? `${dayReservations.length} reservation${dayReservations.length > 1 ? 's' : ''}`
                  : 'Available'}
              >
                {day}
              </button>
            );
          })}
        </div>

        {!compact && (
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-xs text-muted-foreground">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 ring-2 ring-primary rounded-full" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 ring-2 ring-yellow-400 bg-background rounded-full" />
              <span className="text-xs text-muted-foreground">Selected Listing</span>
            </div>
            {isLoadingReservations && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading reservations…</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingListings) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEmptyState) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">No listings yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Create your first listing to start welcoming guests.
            </p>
            <Button
              onClick={() => navigate('/host/listings/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            My Listings
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm">
              <Home className="h-4 w-4 text-primary" />
              {activePropertyCount} active {activePropertyCount === 1 ? 'property' : 'properties'}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2"
            >
              <Grid className="h-4 w-4" />
              {isMobile ? 'Grid' : 'Grid View'}
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              {isMobile ? 'Calendar' : 'Calendar View'}
            </Button>
          </div>
          <Button onClick={() => navigate('/host/listings/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Listing
          </Button>
        </div>
      </div>

      {!isMobile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing) => {
                  const location =
                    listing.property?.address ?? listing.property?.location?.address ?? 'Address unavailable';
                  const coverImage = listing.images?.[0];

                  return (
                    <Card
                      key={listing.id}
                      ref={(el) => {
                        listingRefs.current[listing.id] = el;
                      }}
                      className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card shadow-sm hover:scale-[1.02] group cursor-pointer ${
                        selectedListing === listing.id ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      onClick={() => setSelectedListing(listing.id)}
                    >
                      <div className="relative">
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt={listing.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center text-4xl">🏠</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {listing.rating?.toFixed(1) ?? '—'}
                          <span className="text-muted-foreground text-xs">({listing.total_reviews ?? 0})</span>
                        </div>
                        <div className="absolute bottom-3 left-3 text-white">
                          <h3 className="font-bold text-lg leading-tight">{listing.name}</h3>
                          <p className="text-white/90 text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {location}
                          </p>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                          <div className="text-sm">
                            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{listing.max_guests ?? '—'}</span>
                            <p className="text-xs text-muted-foreground">Guests</p>
                          </div>
                          <div className="text-sm">
                            <Home className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{listing.bedrooms ?? '—'}</span>
                            <p className="text-xs text-muted-foreground">Beds</p>
                          </div>
                          <div className="text-sm">
                            <div className="h-4 w-4 mx-auto mb-1 flex items-center justify-center text-muted-foreground">
                              <span className="text-xs font-bold">B</span>
                            </div>
                            <span className="font-semibold text-foreground">{listing.bathrooms ?? '—'}</span>
                            <p className="text-xs text-muted-foreground">Baths</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                            <Coins className="h-4 w-4" />
                            <span>{formatUGX(listing.price_per_night)}</span>
                            <span className="text-sm font-normal text-muted-foreground">/night</span>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              listing.is_active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {listing.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 hover:bg-accent"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/host/listings/${listing.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            onClick={(event) => handleDeleteClick(listing, event)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending && listingToDelete?.id === listing.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="lg:sticky lg:top-8 lg:h-fit">
              <CalendarComponent />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="space-y-4">
                {listings.map((listing) => {
                  const location =
                    listing.property?.address ?? listing.property?.location?.address ?? 'Address unavailable';
                  const coverImage = listing.images?.[0];

                  return (
                    <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-sm">
                      <div className="flex">
                        <div className="flex-1 p-4">
                          <h3 className="font-bold text-lg mb-2">{listing.name}</h3>
                          <div className="space-y-2 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{location}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{listing.max_guests ?? '—'} guests</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Home className="h-3 w-3" />
                                <span>{listing.bedrooms ?? '—'} beds</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                              <Coins className="h-4 w-4" />
                              <span>{formatUGX(listing.price_per_night)}</span>
                              <span className="text-sm font-normal text-muted-foreground">/night</span>
                            </div>
                            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {listing.rating?.toFixed(1) ?? '—'}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/host/listings/${listing.id}`)}
                            >
                              Manage
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              onClick={(event) => handleDeleteClick(listing, event)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending && listingToDelete?.id === listing.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {coverImage ? (
                          <img src={coverImage} alt={listing.name} className="w-24 h-32 object-cover" />
                        ) : (
                          <div className="w-24 h-32 bg-muted flex items-center justify-center text-2xl">🏠</div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <CalendarComponent compact />
            )}
          </div>
        )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Listing
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>"{listingToDelete?.name}"</strong>?
              </p>
              <p className="text-red-600 font-medium">
                This action cannot be undone. All data associated with this listing, including photos and booking history, will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Listing
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HostListings;