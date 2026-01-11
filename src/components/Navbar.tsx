import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar, 
  User, 
  Heart, 
  Menu,
  X,
  Bell,
  MessageCircle,
  MapPin,
  Flame,
  ThumbsUp,
  ShieldCheck
} from 'lucide-react';
import { User as UserType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { useChatRooms } from '@/context/ChatRoomsContext';
import { ChatRoomsList } from '@/components/chat/ChatRoomsList';
import { NotificationList } from '@/components/shared/NotificationList';
import ErrorBoundary from '@/components/ErrorBoundary';

interface NavbarProps {
  user: UserType | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { getItemCount } = useBooking();
  const { rooms, totalUnreadCount } = useChatRooms();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatRoomsOpen, setChatRoomsOpen] = useState(false);
  const [notificationListOpen, setNotificationListOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const bookingItemCount = getItemCount();
  const totalUnreadNotifications = totalUnreadCount;
  const currentUserRole = user?.role === 'host' ? 'host' : 'guest';

  // Hide navbar on map route for mobile (immersive experience)
  const isMapRoute = location.pathname === '/map' || location.pathname === '/properties/map';
  const shouldHideOnMobile = isMapRoute;

  const categories = [
    { id: 'nearby', label: 'Near By', icon: MapPin },
    { id: 'popular', label: 'Popular', icon: Flame },
    { id: 'recommended', label: 'Recommended', icon: ThumbsUp },
    { id: 'verified', label: 'Verified', icon: ShieldCheck }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    // Navigate or filter based on category
    navigate(`/?category=${categoryId}`);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-accent ${shouldHideOnMobile ? 'lg:block hidden' : ''}`}>
      {/* Main Navigation Bar */}
      <div className="mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo - Always visible */}
          <Link to="/" className="text-lg sm:text-xl font-bold text-primary flex-shrink-0">
            CavaYo
          </Link>

          {/* Category Filters - Desktop (Pills) */}
          <div className="hidden lg:flex items-center justify-center space-x-2 flex-1 max-w-2xl mx-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={`
                    px-4 py-1.5 rounded-full transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-primary-foreground scale-105 shadow-sm' 
                      : 'bg-primary/5 border-primary/30 text-ink hover:bg-primary/50 hover:scale-[1.02]'
                    }
                  `}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {category.label}
                </Button>
              );
            })}
          </div>

          {/* Desktop Actions */}
          {user ? (
            <div className="hidden lg:flex items-center space-x-2">
              <Button 
                size="icon" 
                className="relative bg-primary/80 !text-accent hover:bg-primary/90 rounded-full h-10 w-10"
                onClick={() => navigate('/chats')}
              >
                <MessageCircle className="h-5 w-5" />
                {totalUnreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0 bg-blue-500">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </Badge>
                )}
              </Button>

              <Button 
                size="icon" 
                className="relative bg-primary/80 !text-accent hover:bg-primary/90 rounded-full h-10 w-10"
                onClick={() => setNotificationListOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {totalUnreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0 bg-red-500">
                    {totalUnreadNotifications > 9 ? '9+' : totalUnreadNotifications}
                  </Badge>
                )}
              </Button>

              {user.role === 'guest' && (
                <>
                  <Link to="/favorites">
                    <Button size="icon" className="bg-primary/80 !text-accent hover:bg-primary/90 rounded-full h-10 w-10">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>

                  <Link to="/bookings" className="relative">
                    <Button size="icon" className="bg-primary/80 !text-accent hover:bg-primary/90 rounded-full h-10 w-10">
                      <Calendar className="h-5 w-5" />
                    </Button>
                    {bookingItemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0">
                        {bookingItemCount > 99 ? '99+' : bookingItemCount}
                      </Badge>
                    )}
                  </Link>
                </>
              )}

              <Link to="/profile">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary/85 text-primary-foreground text-sm">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}

          {/* Mobile Actions - Main Row Only */}
          {user ? (
            <div className="flex lg:hidden items-center space-x-2">
              <Button
                size="icon"
                variant="ghost"
                className="relative h-9 w-9 !text-primary hover:!text-primary/80"
                onClick={() => navigate('/chats')}
              >
                <MessageCircle className="h-5 w-5" />
                {totalUnreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0 bg-blue-500">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </Badge>
                )}
              </Button>

              <Button 
                size="icon"
                variant="ghost"
                className="relative h-9 w-9 !text-primary hover:!text-primary/80"
                onClick={() => setNotificationListOpen(true)}
              >
                <Bell className="h-4 w-4" />
                {totalUnreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center text-xs p-0 bg-red-500">
                    {totalUnreadNotifications > 9 ? '9+' : totalUnreadNotifications}
                  </Badge>
                )}
              </Button>
              
              {user.role === 'guest' && (
                <Link to="/bookings" className="relative">
                  <Button size="icon" variant="ghost" className="h-9 w-9 !text-primary hover:!text-primary/80">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  {bookingItemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center text-xs p-0">
                      {bookingItemCount > 99 ? '99+' : bookingItemCount}
                    </Badge>
                  )}
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 !text-primary hover:!text-primary/80"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Mobile Navigation - Only for non-logged in users */}
        {mobileMenuOpen && !user && (
          <div className="sm:hidden border-t">
            <div className="py-3 px-3 flex flex-col items-center space-y-2">
              <Link
                to="/login"
                className="w-full text-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 bg-primary/5 border border-primary/30 text-ink hover:bg-primary/50 hover:scale-[1.02]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="w-full text-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-[1.02]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}

        {/* Mobile Navigation - For logged in users */}
        {mobileMenuOpen && user && (
          <div className="lg:hidden border-t">
            <div className="py-3 px-3 flex flex-col items-center space-y-2">
              <Link
                to="/profile"
                className="w-full text-center flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 bg-primary/5 border border-primary/30 text-ink hover:bg-primary/50 hover:scale-[1.02]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
              {user.role === 'guest' && (
                <Link
                  to="/favorites"
                  className="w-full text-center flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 bg-primary/5 border border-primary/30 text-ink hover:bg-primary/50 hover:scale-[1.02]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favorites
                </Link>
              )}
              <button
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:scale-[1.02]"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification List Dialog */}
      {notificationListOpen && (
        <ErrorBoundary>
          <NotificationList
            isOpen={notificationListOpen}
            onClose={() => setNotificationListOpen(false)}
            onSelectConversation={(room) => {
              navigate(`/chats/${room.bookingId}`);
            }}
          />
        </ErrorBoundary>
      )}
    </nav>
  );
};

export default Navbar;