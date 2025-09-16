import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types/orders';
import {
  MapPin,
  User as UserIcon,
  Store as StoreIcon,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MessageCircle
} from 'lucide-react';
import CreatePostCard from '@/components/guest/profile/orders/CreatePostCard';
import { useImageCapture } from '@/hooks/useImageCapture';
import CameraCapture from '@/components/features/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { ChatDialog } from './ChatDialog';
import { useChat } from '@/context/ChatContext';

type OrderCardContext = 'customer' | 'vendor';

interface OrderCardProps {
  order: Order;
  context: OrderCardContext;
  onStartPost?: (order: Order) => void;
  isPostDisabled?: boolean;
  onConfirm?: (order: Order) => Promise<void>;
  onReject?: (order: Order) => Promise<void>;
  onOpenConversation?: (order: Order) => void;
}

const getStatusBadgeVariant = (status: Order['status']): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'pending':
    case 'processing':
    default:
      return 'default';
  }
};

const formatUGX = (value: number) => `UGX ${Number(value).toLocaleString()}`;

export const OrderCard: React.FC<OrderCardProps> = ({
                                                      order,
                                                      context,
                                                      onStartPost,
                                                      isPostDisabled,
                                                      onConfirm,
                                                      onReject,
                                                      onOpenConversation
                                                    }) => {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [hasActionCompleted, setHasActionCompleted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const imageCapture = useImageCapture();
  const { toast } = useToast();
  const { getUnreadCount } = useChat();
  const createdAt = new Date(order.created_at);
  const deliveryType = order.delivery_address && order.delivery_address !== 'N/A for pickup' ? 'Delivery' : 'Pickup';

  // Check if order is in a state that allows confirm/reject actions
  const canPerformActions = order.status === 'pending';
  
  // Check if order has completed an action (confirmed/rejected)
  const hasCompletedAction = order.status === 'processing' || order.status === 'cancelled';

  const handleConfirm = async () => {
    if (!onConfirm || isActionInProgress) return;
    
    setIsActionInProgress(true);
    try {
      await onConfirm(order);
      setHasActionCompleted(true);
      toast({
        title: 'Order Confirmed',
        description: 'Order has been confirmed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Confirmation Failed',
        description: error instanceof Error ? error.message : 'Failed to confirm order.',
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
      await onReject(order);
      setHasActionCompleted(true);
      toast({
        title: 'Order Rejected',
        description: 'Order has been rejected successfully.',
      });
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject order.',
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
                Order #{order.id}
              </CardTitle>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
                {createdAt.toLocaleDateString()}
              </p>
            </div>
            <div className="text-right flex-shrink-0 min-w-0">
              <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-[9px] sm:text-xs px-1 py-0.5">
                {order.status}
              </Badge>
              <p className="text-xs sm:text-sm md:text-base font-bold mt-0.5 leading-tight">
                {formatUGX(order.total)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2 sm:p-3 lg:p-4 pt-0 flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-2 text-[10px] sm:text-xs text-muted-foreground min-w-0">
            {context === 'customer' ? (
                <>
                  <StoreIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="truncate flex-1 min-w-0">{order.shop?.name ?? 'Shop'}</span>
                </>
            ) : (
                <>
                  <UserIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="truncate flex-1 min-w-0">{order.user?.name ?? 'Customer'}</span>
                </>
            )}
            <span className="mx-0.5 sm:mx-1 flex-shrink-0 text-[8px] sm:text-[10px]">•</span>
            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="truncate max-w-[3rem] sm:max-w-none">{deliveryType}</span>
          </div>

          <div className="space-y-1 sm:space-y-1.5 flex-1 mb-2 min-w-0">
            {order.items.slice(0, 3).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between text-[10px] sm:text-xs gap-1 sm:gap-2 min-w-0">
              <span className="truncate flex-1 min-w-0 leading-tight">
                {(item.product?.name ?? 'Item')} × {item.quantity}
              </span>
                  <span className="flex-shrink-0 font-medium text-[9px] sm:text-xs">
                {formatUGX(item.price * item.quantity)}
              </span>
                </div>
            ))}
            {order.items.length > 3 && (
                <div className="text-[9px] sm:text-xs text-muted-foreground text-center py-0.5">
                  +{order.items.length - 3} more items
                </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-auto mb-2">
            <Badge variant="outline" className="text-[9px] sm:text-xs px-1 py-0.5 leading-tight">
              {deliveryType}
            </Badge>
            {order.notes && (
                <Badge
                    variant="outline"
                    className="truncate max-w-[4rem] sm:max-w-[6rem] md:max-w-[8rem] text-[9px] sm:text-xs px-1 py-0.5 leading-tight"
                    title={order.notes}
                >
                  Note
                </Badge>
            )}
          </div>

          {/* Conditional rendering based on context */}
          <div className="mt-1 sm:mt-2">
            {context === 'customer' ? (
                /* Customer context - Post review functionality */
                <>
                  {/* Open CTA (disabled if already posted). Hidden while composer is open */}
                  {!isComposerOpen && (
                      <button
                          type="button"
                          onClick={() => {
                            setIsComposerOpen(true);
                            onStartPost?.(order);
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
                      Review Order #{order.id}
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
                              createContext={{ shopId: order.shop_id, productId: order.items[0]?.product_id }}
                              forceExpanded={true}
                          />
                        </div>
                    )}
                  </div>
                </>
            ) : (
                /* Vendor context - Action buttons */
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Confirm and Reject buttons - only show for pending orders and before action completion */}
                  {canPerformActions && !hasActionCompleted && (
                    <>
                      <button
                          type="button"
                          onClick={handleConfirm}
                          disabled={isActionInProgress}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-green-200 text-green-700 hover:bg-green-50 transition-colors min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Confirm order"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="hidden sm:inline truncate">
                          {isActionInProgress ? 'Confirming...' : 'Confirm'}
                        </span>
                      </button>

                      <button
                          type="button"
                          onClick={handleReject}
                          disabled={isActionInProgress}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 transition-colors min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reject order"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="hidden sm:inline truncate">
                          {isActionInProgress ? 'Rejecting...' : 'Reject'}
                        </span>
                      </button>
                    </>
                  )}

                  {/* Chat button - always visible for vendor context */}
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
                      // We need to get the conversation ID for this order to check unread count
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

          {/* Camera modal - only for customer context */}
          {context === 'customer' && imageCapture.showCameraModal && (
              <div className="fixed inset-0 z-50 bg-background">
                <CameraCapture
                    onCapture={(img) => imageCapture.handleCameraCapture(img)}
                    onClose={() => imageCapture.handleCameraClose()}
                />
              </div>
          )}
        </CardContent>

        {/* Chat Dialog */}
        {context === 'vendor' && (
          <ChatDialog
            order={order}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </Card>
  );
};

export default OrderCard;