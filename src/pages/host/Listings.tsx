import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Home,
  MapPin,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  Edit,
  Eye,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Grid,
  Loader2,
} from 'lucide-react';
import { listingService } from '@/services/listingService';
import { bookingService } from '@/services/bookingService';
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
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const listingRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
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
      <div className={`bg-white rounded-lg ${compact ? 'p-3' : 'p-6'} border`}>
        {!compact && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-gray-900">Reservations Calendar</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-gray-900 min-w-[120px] text-center text-sm">
                {monthNames[month]} {year}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-7 gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          {days.map((dayLabel) => (
            <div
              key={dayLabel}
              className={`text-center font-semibold text-gray-500 ${compact ? 'py-1' : 'py-2'}`}
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
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}
                  ${today ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
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
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full" />
              <span className="text-xs text-gray-600">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 ring-2 ring-blue-400 rounded-full" />
              <span className="text-xs text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 ring-2 ring-yellow-400 bg-white rounded-full" />
              <span className="text-xs text-gray-600">Selected Listing</span>
            </div>
            {isLoadingReservations && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEmptyState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">No listings yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Create your first listing to start welcoming guests.
            </p>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              My Listings
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm shadow-sm border">
                <Home className="h-4 w-4 text-blue-600" />
                {activePropertyCount} active {activePropertyCount === 1 ? 'property' : 'properties'}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
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
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
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
                      className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-sm hover:scale-[1.02] group cursor-pointer ${
                        selectedListing === listing.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
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
                          <span className="text-gray-500 text-xs">({listing.total_reviews ?? 0})</span>
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
                            <Users className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                            <span className="font-semibold text-gray-900">{listing.max_guests ?? '—'}</span>
                            <p className="text-xs text-gray-500">Guests</p>
                          </div>
                          <div className="text-sm">
                            <Home className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                            <span className="font-semibold text-gray-900">{listing.bedrooms ?? '—'}</span>
                            <p className="text-xs text-gray-500">Beds</p>
                          </div>
                          <div className="text-sm">
                            <div className="h-4 w-4 mx-auto mb-1 flex items-center justify-center text-gray-500">
                              <span className="text-xs font-bold">B</span>
                            </div>
                            <span className="font-semibold text-gray-900">{listing.bathrooms ?? '—'}</span>
                            <p className="text-xs text-gray-500">Baths</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1 font-bold text-lg text-gray-900">
                            <DollarSign className="h-4 w-4" />
                            {listing.price_per_night.toLocaleString()}
                            <span className="text-sm font-normal text-gray-600">/night</span>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              listing.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {listing.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 hover:bg-gray-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/host/listings/${listing.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 hover:bg-blue-50 hover:text-blue-600">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
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
                          <div className="space-y-2 text-sm text-gray-600 mb-3">
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
                            <div className="flex items-center gap-1 font-semibold text-gray-900">
                              <DollarSign className="h-4 w-4" />
                              {listing.price_per_night.toLocaleString()}
                              <span className="text-sm font-normal text-gray-600">/night</span>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
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
      </div>
    </div>
  );
};

export default HostListings;