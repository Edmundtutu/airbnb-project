import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

interface CreatePostCollapsedProps {
  user: User | null;
  onExpand: () => void;
}

const CreatePostCollapsed: React.FC<CreatePostCollapsedProps> = ({ user, onExpand }) => {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary text-primary-foreground">
          {user?.name?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <Button
        variant="outline"
        className="flex-1 justify-start text-left h-10 bg-muted/50 hover:bg-muted"
        onClick={onExpand}
      >
        <span className="text-muted-foreground text-xs lg:text-sm">Want to share your purchases?</span>
      </Button>
    </div>
  );
};

export default CreatePostCollapsed;


