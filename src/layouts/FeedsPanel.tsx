import React from 'react';

const FeedsPanel: React.FC = () => {
  // Mock data for recent events
  const recentEvents = [
    {
      id: 1,
      type: 'rating',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face',
      title: 'New Property Ratings',
      description: '5 new ratings for Kampala apartments',
      time: '2 hours ago',
      urgent: false
    },
    {
      id: 2,
      type: 'event',
      avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=40&h=40&fit=crop&crop=face',
      title: 'Nyegenyege Festival',
      description: 'Music festival coming to Jinja next month',
      time: '1 day ago',
      urgent: false
    },
    {
      id: 3,
      type: 'alert',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      title: 'Travel Advisory',
      description: 'Avoid border areas in Karamoja region',
      time: '3 hours ago',
      urgent: true
    },
    {
      id: 4,
      type: 'update',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
      title: 'Road Closures',
      description: 'Entebbe Expressway maintenance this weekend',
      time: '5 hours ago',
      urgent: false
    }
  ];

  // Mock data for notifications
  const notifications = [
    {
      id: 1,
      type: 'booking',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=40&h=40&fit=crop&crop=face',
      title: 'Booking Accepted',
      description: 'Your booking at Speke Resort was confirmed',
      time: '10 min ago',
      read: false
    },
    {
      id: 2,
      type: 'like',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face',
      title: 'Liked Your Post',
      description: 'Sarah liked your review of Lake Victoria Serena',
      time: '45 min ago',
      read: false
    },
    {
      id: 3,
      type: 'comment',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=40&h=40&fit=crop&crop=face',
      title: 'Replied to Comment',
      description: 'John replied to your comment on Kampala nightlife',
      time: '2 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'post',
      avatar: 'https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=40&h=40&fit=crop&crop=face',
      title: 'New Post',
      description: 'David shared tips for budget travel in Uganda',
      time: '4 hours ago',
      read: true
    },
    {
      id: 5,
      type: 'follow',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=40&h=40&fit=crop&crop=face',
      title: 'New Follower',
      description: 'TravelUganda started following you',
      time: '1 day ago',
      read: true
    }
  ];

  return (
    <div className="sticky top-20 space-y-4">
      {/* Recent Events */}
      <div className="bg-card rounded-lg p-4 border">
        <h3 className="font-semibold mb-3">Recent Events</h3>
        <div className="space-y-3">
          {recentEvents.map((event) => (
            <div 
              key={event.id} 
              className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                event.urgent ? 'bg-red-50 border border-red-200' : 'hover:bg-accent'
              }`}
            >
              <div className="flex-shrink-0">
                <img 
                  src={event.avatar} 
                  alt={event.title}
                  className="w-8 h-8 rounded-full object-cover border-2 border-background"
                />
                {event.urgent && (
                  <div className="relative">
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-background rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  {event.urgent && (
                    <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                      Alert
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 text-center text-sm text-primary hover:underline pt-2 border-t">
          View All Events
        </button>
      </div>
      
      {/* Notifications */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Notifications</h3>
          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            {notifications.filter(n => !n.read).length} new
          </span>
        </div>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                !notification.read ? 'bg-blue-50 border border-blue-200' : 'hover:bg-accent'
              }`}
            >
              <div className="flex-shrink-0 relative">
                <img 
                  src={notification.avatar} 
                  alt={notification.title}
                  className="w-8 h-8 rounded-full object-cover border-2 border-background"
                />
                {!notification.read && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-background rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium flex-1 truncate">{notification.title}</p>
                  {!notification.read && (
                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 text-center text-sm text-primary hover:underline pt-2 border-t">
          See All Notifications
        </button>
      </div>
    </div>
  );
};

export default FeedsPanel;  