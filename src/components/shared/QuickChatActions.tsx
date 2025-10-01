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
  bookingStatus?: string;
  userRole?: 'guest' | 'host';
}

export const QuickChatActions: React.FC<QuickChatActionsProps> = ({
  onActionSelect,
  bookingStatus = 'pending',
  userRole = 'guest'
}) => {
  const getQuickActions = (): QuickChatAction[] => {
    if (userRole === 'guest') {
      return [
        {
          id: 'status',
          text: 'What\'s the status of my booking?',
          icon: <Calendar className="h-3 w-3" />,
          type: 'question'
        },
        {
          id: 'checkin',
          text: 'What time can I check in?',
          icon: <Clock className="h-3 w-3" />,
          type: 'question'
        },
        {
          id: 'modify',
          text: 'Can I modify my booking?',
          icon: <MessageCircle className="h-3 w-3" />,
          type: 'question'
        },
        {
          id: 'issue',
          text: 'I have an issue with my booking',
          icon: <MessageCircle className="h-3 w-3" />,
          type: 'issue'
        }
      ];
    } else {
      return [
        {
          id: 'confirm',
          text: 'Booking confirmed and property is ready',
          icon: <Calendar className="h-3 w-3" />,
          type: 'update'
        },
        {
          id: 'ready',
          text: 'Property is ready for check-in',
          icon: <Calendar className="h-3 w-3" />,
          type: 'update'
        },
        {
          id: 'delay',
          text: 'Check-in may be delayed',
          icon: <Clock className="h-3 w-3" />,
          type: 'update'
        },
        {
          id: 'question',
          text: 'I have a question about your booking',
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