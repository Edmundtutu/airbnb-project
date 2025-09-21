import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Store } from 'lucide-react';

const HostProfile: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Property Profile</h1>
      
      <Card>
        <CardContent className="p-8 text-center">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Set up your property</h3>
          <p className="text-muted-foreground">
            Complete your property profile to start hosting
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HostProfile;