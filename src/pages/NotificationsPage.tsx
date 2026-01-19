import React from 'react';
import { NotificationList } from '@/components/notifications';

/**
 * Full-page notifications view
 */
const NotificationsPage: React.FC = () => {
  return (
    <div className="container max-w-3xl py-8">
      <NotificationList />
    </div>
  );
};

export default NotificationsPage;
