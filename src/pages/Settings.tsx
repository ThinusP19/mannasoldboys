import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, User, Shield, Moon, Globe, Smartphone } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from "@/components/LanguageToggle";
import { useToast } from "@/hooks/use-toast";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
} from "@/lib/push-notifications";

const Settings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);

  // Check push notification status on mount
  useEffect(() => {
    const checkPushStatus = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);

      if (supported) {
        const subscribed = await isSubscribedToPush();
        setPushEnabled(subscribed);
      }
      setPushLoading(false);
    };
    checkPushStatus();
  }, []);

  const handlePushToggle = async (enabled: boolean) => {
    setPushLoading(true);
    try {
      if (enabled) {
        const success = await subscribeToPush();
        if (success) {
          setPushEnabled(true);
          toast({
            title: t('settings.push_enabled'),
            description: t('settings.push_enabled_desc'),
          });
        } else {
          // Check if permission was denied
          const permission = getNotificationPermission();
          if (permission === 'denied') {
            toast({
              title: t('settings.push_blocked'),
              description: t('settings.push_blocked_desc'),
              variant: "destructive",
            });
          } else {
            toast({
              title: t('status.error'),
              description: t('settings.push_error'),
              variant: "destructive",
            });
          }
        }
      } else {
        await unsubscribeFromPush();
        setPushEnabled(false);
        toast({
          title: t('settings.push_disabled'),
          description: t('settings.push_disabled_desc'),
        });
      }
    } catch (error) {
      console.error("Push toggle error:", error);
      toast({
        title: t('status.error'),
        description: t('settings.push_error'),
        variant: "destructive",
      });
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <AppLayout title={t('settings.title')}>
      <div className="p-4 md:p-8 bg-[#f5f0e8] min-h-full">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Account Settings */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>{t('settings.account')}</CardTitle>
                  <CardDescription>{t('settings.account_desc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('profile.email')}</Label>
                <Input id="email" type="email" placeholder="your.email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('profile.phone')}</Label>
                <Input id="phone" type="tel" placeholder="+27 12 345 6789" />
              </div>
              <Button className="w-full md:w-auto">{t('profile.save_changes')}</Button>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>{t('settings.privacy')}</CardTitle>
                  <CardDescription>{t('settings.privacy_desc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.show_contact')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.show_contact_desc')}</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.show_social')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.show_social_desc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.profile_visibility')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.profile_visibility_desc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>{t('settings.notifications')}</CardTitle>
                  <CardDescription>{t('settings.notifications_desc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Push Notifications Toggle - Main Feature */}
              {pushSupported && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">{t('settings.push_notifications')}</Label>
                      <p className="text-sm text-muted-foreground">{t('settings.push_notifications_desc')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={pushEnabled}
                    onCheckedChange={handlePushToggle}
                    disabled={pushLoading}
                  />
                </div>
              )}

              {!pushSupported && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-muted-foreground">
                  {t('settings.push_not_supported')}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.email_notifications')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.email_notifications_desc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.event_reminders')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.event_reminders_desc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.new_member_alerts')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.new_member_alerts_desc')}</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>{t('settings.security')}</CardTitle>
                  <CardDescription>{t('settings.security_desc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('profile.current_password')}</Label>
                <Input id="currentPassword" type="password" placeholder={t('profile.current_password_placeholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('profile.new_password')}</Label>
                <Input id="newPassword" type="password" placeholder={t('profile.new_password_placeholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('profile.confirm_password')}</Label>
                <Input id="confirmPassword" type="password" placeholder={t('profile.confirm_password_placeholder')} />
              </div>
              <Button className="w-full md:w-auto">{t('profile.update_password')}</Button>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>{t('settings.language')}</CardTitle>
                  <CardDescription>{t('settings.language_desc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.language')}</Label>
                  <p className="text-sm text-muted-foreground">English / Afrikaans</p>
                </div>
                <LanguageToggle />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
