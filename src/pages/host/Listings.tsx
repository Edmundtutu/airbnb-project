import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Home } from 'lucide-react';

const HostListings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Listing
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-8 text-center">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Create your first listing</h3>
          <p className="text-muted-foreground mb-4">
            Start hosting by adding your property details
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HostListings;