import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Package, Clock, User } from 'lucide-react';

interface QuickChatAction {
  id: string;
  text: string;
  icon?: React.ReactNode;
  type?: 'question' | 'update' | 'issue';
}

interface QuickChatActionsProps {
  onActionSelect: (action: QuickChatAction) => void;
  orderStatus?: string;
  userRole?: 'customer' | 'vendor';
}

export const QuickChatActions: React.FC<QuickChatActionsProps> = ({
  onActionSelect,
  orderStatus = 'pending',
  userRole = 'customer'
}) => {
  const getQuickActions = (): QuickChatAction[] => {
    if (userRole === 'customer') {
      return [
        {
          id: 'status',
          text: 'What\'s the status of my order?',
          icon: <Package className="h-3 w-3" />,
          type: 'question'
        },
        {
          id: 'delivery',
          text: 'When will it be delivered?',
          icon: <Clock className="h-3 w-3" />,
          type: 'question'
        },
        {
          id: 'modify',
          text: 'Can I modify my order?',
          icon: <MessageCircle className="h-3 w-3" />,
          type: 'question'
        },
        {
          id: 'issue',
          text: 'I have an issue with my order',
          icon: <MessageCircle className="h-3 w-3" />,
          type: 'issue'
        }
      ];
    } else {
      return [
        {
          id: 'confirm',
          text: 'Order confirmed and being prepared',
          icon: <Package className="h-3 w-3" />,
          type: 'update'
        },
        {
          id: 'ready',
          text: 'Order is ready for pickup/delivery',
          icon: <Package className="h-3 w-3" />,
          type: 'update'
        },
        {
          id: 'delay',
          text: 'There will be a slight delay',
          icon: <Clock className="h-3 w-3" />,
          type: 'update'
        },
        {
          id: 'question',
          text: 'I have a question about your order',
          icon: <MessageCircle className="h-3 w-3" />,
          type: 'question'
        }
      ];
    }
  };

  const actions = getQuickActions();

  return (
    <div className="border-t pt-3 mb-3">
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        Quick actions
      </div>
      <div className="flex flex-wrap gap-1">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2 py-1"
            onClick={() => onActionSelect(action)}
          >
            {action.icon}
            <span className="ml-1 truncate max-w-[120px]">{action.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};