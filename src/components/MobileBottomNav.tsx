import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  MapPin, 
  ShoppingCart, 
  User,
  Store,
  Package,
  BarChart3,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useChat } from '@/context/ChatContext';
import { Badge } from '@/components/ui/badge';
import { ConversationList } from '@/components/shared/ConversationList';
import { ChatDialog } from '@/components/shared/ChatDialog';
import type { Conversation } from '@/services/chatService';

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  onClick?: () => void;
}

const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const location = useLocation();
  const [conversationListOpen, setConversationListOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  if (!user) return null;

  const cartItemCount = getItemCount();

  // Safely get chat context with fallback
  let conversations: Conversation[] = [];
  let getUnreadCount = (id: number) => 0;
  
  try {
    const chatContext = useChat();
    conversations = chatContext.conversations || [];
    getUnreadCount = chatContext.getUnreadCount || (() => 0);
  } catch (error) {
    // Chat context not available, use fallback values
    console.warn('Chat context not available:', error);
  }

  const totalUnreadMessages = conversations.reduce((total, conversation) => {
    return total + getUnreadCount(conversation.id);
  }, 0);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setChatDialogOpen(true);
  };

  const handleChatDialogClose = () => {
    setChatDialogOpen(false);
    setSelectedConversation(null);
  };

  const customerNavItems: NavItem[] = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Discover', href: '/discover', icon: Search },
    { name: 'Map', href: '/map', icon: MapPin },
    { name: 'Chat', icon: MessageCircle, badge: totalUnreadMessages, onClick: () => setConversationListOpen(true) },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const vendorNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: BarChart3 },
    { name: 'Inventory', href: '/vendor/Inventory', icon: Package },
    { name: 'Orders', href: '/vendor/orders', icon: ShoppingCart },
    { name: 'Chat', icon: MessageCircle, badge: totalUnreadMessages, onClick: () => setConversationListOpen(true) },
    { name: 'Profile', href: '/vendor/profile', icon: Store },
  ];

  const navItems = user.role === 'vendor' ? vendorNavItems : customerNavItems;

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t lg:hidden">
      <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
        {navItems.map((item) => {
          const isActive = item.href ? isActivePath(item.href) : false;
          const content = (
            <>
              <div className="relative">
                <item.icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center text-xs p-0 bg-red-500">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 truncate max-w-full ${isActive ? 'font-medium' : ''}`}>
                {item.name}
              </span>
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </>
          );

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative transition-colors text-muted-foreground active:text-foreground"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href!}
              className={`
                flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative transition-colors
                ${isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground active:text-foreground'
                }
              `}
            >
              {content}
            </Link>
          );
        })}
      </div>

      {/* Conversation List Dialog */}
      {conversationListOpen && (
        <ConversationList
          isOpen={conversationListOpen}
          onClose={() => setConversationListOpen(false)}
          onSelectConversation={handleConversationSelect}
        />
      )}

      {/* Chat Dialog */}
      {selectedConversation && chatDialogOpen && (
        <ChatDialog
          order={selectedConversation.order}
          isOpen={chatDialogOpen}
          onClose={handleChatDialogClose}
        />
      )}
    </div>
  );
};

export default MobileBottomNav;