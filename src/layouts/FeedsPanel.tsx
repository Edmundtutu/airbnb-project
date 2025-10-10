import React from 'react';

const FeedsPanel: React.FC = () => {
  return (
    <div className="sticky top-20 space-y-4">
      {/* Quick Actions */}
      <div className="bg-card rounded-lg p-4 border">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
            🏠 Browse Stays
          </button>
          <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
            🗺️ Find Properties Near Me
          </button>
          <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
            ❤️ View Favorites
          </button>
        </div>
      </div>
      
      {/* Trending */}
      <div className="bg-card rounded-lg p-4 border">
        <h3 className="font-semibold mb-3">Trending Now</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              🏠
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Villas</p>
              <p className="text-xs text-muted-foreground">Luxury stays</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              🏢
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Apartments</p>
              <p className="text-xs text-muted-foreground">City stays</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedsPanel;
