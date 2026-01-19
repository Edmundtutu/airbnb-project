/**
 * Settings Page
 * 
 * User settings including notification preferences.
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationSettings } from '@/components/notifications';
import { Bell, User, Shield } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="account">
          <div className="text-center text-muted-foreground py-8">
            Account settings coming soon...
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="text-center text-muted-foreground py-8">
            Security settings coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
