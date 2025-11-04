import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, Home, MapPin, Users, DollarSign, Calendar, 
  Edit, Eye, Trash2, Star, ChevronLeft, ChevronRight,
  Grid, List
} from 'lucide-react';

// Mock data for listings
const mockListings = [
  {
    id: 1,
    title: "Luxury Beachfront Villa",
    location: "Malibu, CA",
    price: 450,
    guests: 8,
    bedrooms: 4,
    bathrooms: 3,
    rating: 4.9,
    reviews: 127,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
    status: "active"
  },
  {
    id: 2,
    title: "Cozy Mountain Cabin",
    location: "Aspen, CO",
    price: 280,
    guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400&h=300&fit=crop",
    status: "active"
  },
  {
    id: 3,
    title: "Modern City Loft",
    location: "New York, NY",
    price: 195,
    guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    rating: 4.7,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    status: "active"
  },
  {
    id: 4,
    title: "Downtown Studio Apartment",
    location: "Chicago, IL",
    price: 120,
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    rating: 4.6,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    status: "active"
  }
];

// Mock reservations for calendar
const mockReservations = [
  { listingId: 1, startDate: new Date(2025, 9, 20), endDate: new Date(2025, 9, 25), guestName: "John D." },
  { listingId: 1, startDate: new Date(2025, 9, 28), endDate: new Date(2025, 10, 2), guestName: "Sarah M." },
  { listingId: 2, startDate: new Date(2025, 9, 22), endDate: new Date(2025, 9, 27), guestName: "Mike P." },
  { listingId: 2, startDate: new Date(2025, 10, 5), endDate: new Date(2025, 10, 10), guestName: "Emma L." },
  { listingId: 3, startDate: new Date(2025, 9, 18), endDate: new Date(2025, 9, 21), guestName: "Alex K." },
  { listingId: 3, startDate: new Date(2025, 10, 1), endDate: new Date(2025, 10, 5), guestName: "Lisa R." },
  { listingId: 4, startDate: new Date(2025, 9, 15), endDate: new Date(2025, 9, 19), guestName: "Tom B." },
];

const HostListings = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 9, 1));
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const listingRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getReservationsForDay = (date: Date) => {
    return mockReservations.filter(res => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const start = new Date(res.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(res.endDate);
      end.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  };

  const getListingReservationsForDay = (listingId: number, date: Date) => {
    return mockReservations.filter(res => {
      if (res.listingId !== listingId) return false;
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const start = new Date(res.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(res.endDate);
      end.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const scrollToListing = (listingId: number) => {
    const element = listingRefs.current[listingId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the listing
      element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 2000);
    }
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    const reservations = getReservationsForDay(date);
    if (reservations.length > 0) {
      const firstReservation = reservations[0];
      setSelectedListing(firstReservation.listingId);
      scrollToListing(firstReservation.listingId);
    }
  };

  const CalendarComponent = ({ compact = false }) => {
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
          {/* Day headers */}
          {days.map(day => (
            <div key={day} className={`text-center font-semibold text-gray-500 ${compact ? 'py-1' : 'py-2'}`}>
              {day}
            </div>
          ))}
          
          {/* Empty cells for days before month starts */}
          {[...Array(startingDayOfWeek)].map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}
          
          {/* Calendar days */}
          {[...Array(daysInMonth)].map((_, idx) => {
            const day = idx + 1;
            const date = new Date(year, month, day);
            const reservations = getReservationsForDay(date);
            const hasReservation = reservations.length > 0;
            const today = isToday(day);
            const isSelected = selectedListing ? 
              getListingReservationsForDay(selectedListing, date).length > 0 : false;
            
            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square rounded-full flex items-center justify-center transition-all
                  hover:scale-105 hover:shadow-md
                  ${hasReservation 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-sm' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                  ${today ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                  ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                  ${compact ? 'text-xs' : 'text-sm'}
                `}
                title={hasReservation ? 
                  `${reservations.length} reservation${reservations.length > 1 ? 's' : ''}` : 
                  'Available'
                }
              >
                {day}
              </button>
            );
          })}
        </div>

        {!compact && (
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full"></div>
              <span className="text-xs text-gray-600">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 ring-2 ring-blue-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 ring-2 ring-yellow-400 bg-white rounded-full"></div>
              <span className="text-xs text-gray-600">Selected Listing</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              My Listings
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm shadow-sm border">
                <Home className="h-4 w-4 text-blue-600" />
                {mockListings.length} active properties
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
                <Calendar className="h-4 w-4" />
                {isMobile ? 'Calendar' : 'Calendar View'}
              </Button>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        {!isMobile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Listings Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockListings.map((listing) => (
                  <Card 
                    key={listing.id} 
                    ref={el => listingRefs.current[listing.id] = el}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-sm hover:scale-[1.02] group cursor-pointer"
                    onClick={() => setSelectedListing(listing.id)}
                  >
                    <div className="relative">
                      <img 
                        src={listing.image} 
                        alt={listing.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {listing.rating}
                        <span className="text-gray-500 text-xs">({listing.reviews})</span>
                      </div>
                      <div className="absolute bottom-3 left-3 text-white">
                        <h3 className="font-bold text-lg leading-tight">{listing.title}</h3>
                        <p className="text-white/90 text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.location}
                        </p>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div className="text-sm">
                          <Users className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                          <span className="font-semibold text-gray-900">{listing.guests}</span>
                          <p className="text-xs text-gray-500">Guests</p>
                        </div>
                        <div className="text-sm">
                          <Home className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                          <span className="font-semibold text-gray-900">{listing.bedrooms}</span>
                          <p className="text-xs text-gray-500">Beds</p>
                        </div>
                        <div className="text-sm">
                          <div className="h-4 w-4 mx-auto mb-1 flex items-center justify-center text-gray-500">
                            <span className="text-xs font-bold">B</span>
                          </div>
                          <span className="font-semibold text-gray-900">{listing.bathrooms}</span>
                          <p className="text-xs text-gray-500">Baths</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 font-bold text-lg text-gray-900">
                          <DollarSign className="h-4 w-4" />
                          {listing.price}
                          <span className="text-sm font-normal text-gray-600">/night</span>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 hover:bg-gray-50">
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
                ))}
              </div>
            </div>

            {/* Calendar Sidebar */}
            <div className="lg:sticky lg:top-8 lg:h-fit">
              <CalendarComponent />
            </div>
          </div>
        ) : (
          /* Mobile Layout */
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="space-y-4">
                {mockListings.map((listing) => (
                  <Card 
                    key={listing.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-sm"
                  >
                    <div className="flex">
                      <div className="flex-1 p-4">
                        <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{listing.location}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{listing.guests} guests</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              <span>{listing.bedrooms} beds</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 font-semibold text-gray-900">
                            <DollarSign className="h-4 w-4" />
                            {listing.price}
                            <span className="text-sm font-normal text-gray-600">/night</span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {listing.rating}
                          </div>
                        </div>
                      </div>
                      <img 
                        src={listing.image} 
                        alt={listing.title}
                        className="w-24 h-32 object-cover"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <CalendarComponent compact={true} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HostListings;