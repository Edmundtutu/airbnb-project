import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Calendar, 
  User, 
  Heart, 
  Menu,
  X,
  Bell,
  MessageCircle
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

  const bookingItemCount = getItemCount();
  const totalUnreadNotifications = totalUnreadCount;
  const currentUserRole = user?.role === 'host' ? 'host' : 'guest';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
  <nav className="bg-gradient-to-br from-red-imperial via-red-cinnabar via-orange-giants to-orange-safety backdrop-blur-sm">
      <div className="mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo - Always visible */}
          <Link to="/" className="text-lg sm:text-xl font-bold text-primary flex-shrink-0">
            CavaYo
          </Link>          

          {/* Desktop Actions */}
          {user ? (
            <div className="hidden lg:flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
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
                variant="ghost" 
                size="icon" 
                className="relative"
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
                    <Button variant="ghost" size="icon">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>

                  <Link to="/bookings" className="relative">
                    <Button variant="ghost" size="icon">
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
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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

          {/* Mobile Actions */}
          {user ? (
            <div className="flex lg:hidden items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
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
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9"
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
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  {bookingItemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center text-xs p-0">
                      {bookingItemCount > 99 ? '99+' : bookingItemCount}
                    </Badge>
                  )}
                </Link>
              )}
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
            <div className="py-3 space-y-1">
              <Link
                to="/login"
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
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