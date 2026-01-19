/**
 * Notification Settings Component
 * 
 * Allows users to manage their notification preferences including
 * push notification registration and per-type/channel settings.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bell, BellOff, Mail, Smartphone, Monitor, AlertTriangle, Check } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { notificationService } from '@/services/notificationService';
import { toast } from '@/hooks/use-toast';
import type { NotificationPreferences } from '@/types/notifications';

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className }) => {
  const {
    isSupported,
    permission,
    isRegistered,
    isLoading: pushLoading,
    error: pushError,
    requestPermission,
    unregister,
  } = usePushNotifications();

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await notificationService.getPreferences();
        setPreferences(response.data);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load notification preferences',
        });
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, []);

  // Update preferences
  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setIsSaving(true);

    try {
      await notificationService.updatePreferences({ [key]: value });
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      console.error('Failed to update preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset preferences to defaults
  const resetPreferences = async () => {
    setIsSaving(true);
    try {
      const response = await notificationService.resetPreferences();
      setPreferences(response.data);
      toast({
        title: 'Preferences Reset',
        description: 'Your notification preferences have been reset to defaults.',
      });
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reset preferences. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPreferences) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Push Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive instant notifications on this device even when the app is closed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Push notifications are not supported in this browser. Try using Chrome, Firefox, or Edge.
              </AlertDescription>
            </Alert>
          ) : permission === 'denied' ? (
            <Alert variant="destructive">
              <BellOff className="h-4 w-4" />
              <AlertDescription>
                Push notifications are blocked. Please enable them in your browser settings to receive notifications.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base">This Device</Label>
                    <p className="text-sm text-muted-foreground">
                      {isRegistered ? 'Receiving push notifications' : 'Not receiving push notifications'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isRegistered && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                  <Button
                    variant={isRegistered ? 'outline' : 'default'}
                    size="sm"
                    onClick={isRegistered ? unregister : requestPermission}
                    disabled={pushLoading}
                  >
                    {pushLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isRegistered ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>

              {pushError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{pushError}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences Card */}
      {preferences && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified for different events
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetPreferences} disabled={isSaving}>
                Reset to defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notification Channels */}
            <div>
              <h4 className="font-medium mb-4">Notification Channels</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.email_enabled}
                    onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on your devices
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={preferences.push_enabled}
                    onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="inapp-notifications">In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in the app
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="inapp-notifications"
                    checked={preferences.in_app_enabled}
                    onCheckedChange={(checked) => updatePreference('in_app_enabled', checked)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notification Types */}
            <div>
              <h4 className="font-medium mb-4">Notification Types</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="booking-notifications">Booking Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      New bookings, confirmations, and cancellations
                    </p>
                  </div>
                  <Switch
                    id="booking-notifications"
                    checked={preferences.booking_notifications}
                    onCheckedChange={(checked) => updatePreference('booking_notifications', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="message-notifications">Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      New messages from hosts and guests
                    </p>
                  </div>
                  <Switch
                    id="message-notifications"
                    checked={preferences.message_notifications}
                    onCheckedChange={(checked) => updatePreference('message_notifications', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-notifications">Marketing & Promotions</Label>
                    <p className="text-sm text-muted-foreground">
                      Special offers, deals, and recommendations
                    </p>
                  </div>
                  <Switch
                    id="marketing-notifications"
                    checked={preferences.marketing_notifications}
                    onCheckedChange={(checked) => updatePreference('marketing_notifications', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="security-notifications">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Account security and login notifications
                    </p>
                  </div>
                  <Switch
                    id="security-notifications"
                    checked={preferences.security_notifications}
                    onCheckedChange={(checked) => updatePreference('security_notifications', checked)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationSettings;
