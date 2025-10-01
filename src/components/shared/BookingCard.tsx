import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/types/bookings';
import {
  MapPin,
  User as UserIcon,
  Home as PropertyIcon,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MessageCircle,
  Calendar,
  Users,
  Bed,
  Bath,
  Clock
} from 'lucide-react';
import CreatePostCard from '@/components/guest/profile/orders/CreatePostCard';
import { useImageCapture } from '@/hooks/useImageCapture';
import CameraCapture from '@/components/features/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { ChatDialog } from './ChatDialog';
import { useChat } from '@/context/ChatContext';

type BookingCardContext = 'guest' | 'host';

interface BookingCardProps {
  booking: Booking;
  context: BookingCardContext;
  onStartPost?: (booking: Booking) => void;
  isPostDisabled?: boolean;
  onConfirm?: (booking: Booking) => Promise<void>;
  onReject?: (booking: Booking) => Promise<void>;
  onAccept?: (booking: Booking) => Promise<void>;
  onOpenConversation?: (booking: Booking) => void;
}

const getStatusBadgeVariant = (status: Booking['status']): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'completed':
    case 'checked_out':
      return 'secondary';
    case 'cancelled':
    case 'rejected':
      return 'destructive';
    case 'confirmed':
    case 'checked_in':
      return 'default';
    case 'pending':
    default:
      return 'default';
  }
};

const formatUGX = (value: number) => `UGX ${Number(value).toLocaleString()}`;

const formatDateRange = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    dateRange: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
    nights: nights
  };
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  context,
  onStartPost,
  isPostDisabled,
  onConfirm,
  onReject,
  onAccept,
  onOpenConversation
}) => {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [hasActionCompleted, setHasActionCompleted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const imageCapture = useImageCapture();
  const { toast } = useToast();
  const { getUnreadCount } = useChat();
  const createdAt = new Date(booking.created_at);
  const { dateRange, nights } = formatDateRange(booking.check_in_date, booking.check_out_date);

  // Check if booking is in a state that allows confirm/reject actions
  const canPerformActions = booking.status === 'pending';
  
  // Check if booking has completed an action (confirmed/rejected)
  const hasCompletedAction = ['confirmed', 'rejected', 'cancelled', 'completed'].includes(booking.status);

  const handleConfirm = async () => {
    if (!onConfirm || isActionInProgress) return;
    
    setIsActionInProgress(true);
    try {
      await onConfirm(booking);
      setHasActionCompleted(true);
      toast({
        title: 'Booking Confirmed',
        description: 'Booking has been confirmed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Confirmation Failed',
        description: error instanceof Error ? error.message : 'Failed to confirm booking.',
        variant: 'destructive',
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || isActionInProgress) return;
    
    setIsActionInProgress(true);
    try {
      await onReject(booking);
      setHasActionCompleted(true);
      toast({
        title: 'Booking Rejected',
        description: 'Booking has been rejected successfully.',
      });
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject booking.',
        variant: 'destructive',
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleAccept = async () => {
    if (!onAccept || isActionInProgress) return;
    
    setIsActionInProgress(true);
    try {
      await onAccept(booking);
      setHasActionCompleted(true);
      toast({
        title: 'Booking Accepted',
        description: 'Booking has been accepted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Accept Failed',
        description: error instanceof Error ? error.message : 'Failed to accept booking.',
        variant: 'destructive',
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  return (
    <Card className="h-full flex flex-col relative w-full min-w-0">
      <CardHeader className="p-2 sm:p-3 lg:p-4 pb-2">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="flex-1 min-w-0 pr-1">
            <CardTitle className="text-xs sm:text-sm md:text-base truncate leading-tight">
              Booking #{booking.id}
            </CardTitle>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
              {createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="text-right flex-shrink-0 min-w-0">
            <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize text-[9px] sm:text-xs px-1 py-0.5">
              {booking.status.replace('_', ' ')}
            </Badge>
            <p className="text-xs sm:text-sm md:text-base font-bold mt-0.5 leading-tight">
              {formatUGX(booking.total)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-3 lg:p-4 pt-0 flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 mb-2 text-[10px] sm:text-xs text-muted-foreground min-w-0">
          {context === 'guest' ? (
            <>
              <PropertyIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate flex-1 min-w-0">{booking.property?.name ?? 'Property'}</span>
            </>
          ) : (
            <>
              <UserIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate flex-1 min-w-0">{booking.guest?.name ?? 'Guest'}</span>
            </>
          )}
          <span className="mx-0.5 sm:mx-1 flex-shrink-0 text-[8px] sm:text-[10px]">•</span>
          <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
          <span className="flex-shrink-0">{booking.guest_count} guests</span>
        </div>

        {/* Listing Details */}
        <div className="space-y-1 sm:space-y-1.5 flex-1 mb-2 min-w-0">
          <div className="flex items-center justify-between text-[10px] sm:text-xs gap-1 sm:gap-2 min-w-0">
            <span className="truncate flex-1 min-w-0 leading-tight font-medium">
              {booking.details?.[0]?.listing?.name ?? 'Listing'}
            </span>
          </div>
          
          {/* Date Range */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
            <span className="truncate flex-1">{dateRange}</span>
          </div>

          {/* Nights and Accommodation Details */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
              <span>{nights} nights</span>
            </div>
            {booking.details?.[0]?.listing?.bedrooms && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Bed className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span>{booking.details[0].listing.bedrooms} bed</span>
                </div>
              </>
            )}
            {booking.details?.[0]?.listing?.bathrooms && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Bath className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span>{booking.details[0].listing.bathrooms} bath</span>
                </div>
              </>
            )}
          </div>

          {/* Location */}
          {booking.property?.location && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
              <span className="truncate flex-1">{booking.property.location.address}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-auto mb-2">
          <Badge variant="outline" className="text-[9px] sm:text-xs px-1 py-0.5 leading-tight">
            {nights} nights
          </Badge>
          <Badge variant="outline" className="text-[9px] sm:text-xs px-1 py-0.5 leading-tight">
            {booking.guest_count} guests
          </Badge>
          {booking.notes && (
            <Badge
              variant="outline"
              className="truncate max-w-[4rem] sm:max-w-[6rem] md:max-w-[8rem] text-[9px] sm:text-xs px-1 py-0.5 leading-tight"
              title={booking.notes}
            >
              Note
            </Badge>
          )}
        </div>

        {/* Conditional rendering based on context */}
        <div className="mt-1 sm:mt-2">
          {context === 'guest' ? (
            /* Guest context - Post review functionality */
            <>
              {/* Open CTA (disabled if already posted). Hidden while composer is open */}
              {!isComposerOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(true);
                    onStartPost?.(booking);
                  }}
                  disabled={isPostDisabled}
                  className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border transition-colors w-full sm:w-auto justify-center sm:justify-start ${
                    isPostDisabled
                      ? 'text-muted-foreground border-muted bg-muted/30 cursor-not-allowed'
                      : 'text-primary border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Post review</span>
                </button>
              )}

              {/* Composer content with its own Close control (always enabled) */}
              <div
                className={`${isComposerOpen ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300 ease-in-out`}
              >
                {isComposerOpen && (
                  <div className="flex items-center justify-between mb-1 sm:mb-2 gap-1">
                    <span className="text-[9px] sm:text-xs text-muted-foreground truncate flex-1">
                      Review Booking #{booking.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(false)}
                      className="text-[9px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-md border hover:bg-muted flex-shrink-0"
                    >
                      <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                )}
                {isComposerOpen && (
                  <div className="w-full min-w-0">
                    <CreatePostCard
                      imageCapture={imageCapture}
                      createContext={{ 
                        propertyId: booking.property_id, 
                        listingId: booking.details?.[0]?.listing_id,
                        bookingId: booking.id 
                      }}
                      forceExpanded={true}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Host context - Action buttons */
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Confirm and Reject buttons - only show for pending bookings and before action completion */}
              {canPerformActions && !hasActionCompleted && (
                <>
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isActionInProgress}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-green-200 text-green-700 hover:bg-green-50 transition-colors min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Accept booking"
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">
                      {isActionInProgress ? 'Accepting...' : 'Accept'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isActionInProgress}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 transition-colors min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reject booking"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">
                      {isActionInProgress ? 'Rejecting...' : 'Reject'}
                    </span>
                  </button>
                </>
              )}

              {/* Chat button - always visible for host context */}
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors min-w-0 relative"
                title="Open conversation"
              >
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Chat</span>
                {/* Unread message badge */}
                {(() => {
                  // We need to get the conversation ID for this booking to check unread count
                  // For now, we'll show a placeholder - this would need to be connected to the actual conversation
                  const unreadCount = 0; // getUnreadCount(conversationId);
                  return unreadCount > 0 ? (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  ) : null;
                })()}
              </button>
            </div>
          )}
        </div>

        {/* Camera modal - only for guest context */}
        {context === 'guest' && imageCapture.showCameraModal && (
          <div className="fixed inset-0 z-50 bg-background">
            <CameraCapture
              onCapture={(img) => imageCapture.handleCameraCapture(img)}
              onClose={() => imageCapture.handleCameraClose()}
            />
          </div>
        )}
      </CardContent>

      {/* Chat Dialog */}
      {context === 'host' && (
        <ChatDialog
          booking={booking}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </Card>
  );
};

// Legacy alias for backward compatibility
export const OrderCard = BookingCard;

export default BookingCard;