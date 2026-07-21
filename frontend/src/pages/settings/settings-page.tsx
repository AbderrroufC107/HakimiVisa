import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Save,
  Building,
  MapPin,
  Phone,
  Globe,
  Mail,
  Loader2,
  UserCog,
  Pencil,
  UserPlus,
  Monitor,
  Bell,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { authService } from '@/services';
import { api } from '@/services/api';
import { useAuth, useTheme } from '@/providers';
import { useLanguage, getLanguageOptions } from '@/i18n';
import {
  loadSettingsPreferences,
  saveSettingsPreferences,
  type SettingsPreferences,
} from './settings-preferences';
import { RefDataSettings } from './ref-data-settings';
import type { CreateManagerRequest, UpdateProfileRequest } from '@/types';

interface AgencySettings {
  agencyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string | null;
}

function normalizeAgencySettings(settings?: Partial<AgencySettings>): AgencySettings {
  return {
    agencyName: settings?.agencyName ?? '',
    address: settings?.address ?? '',
    phone: settings?.phone ?? '',
    email: settings?.email ?? '',
    website: settings?.website ?? '',
    logoUrl: settings?.logoUrl ?? null,
  };
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const languageOptions = getLanguageOptions();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isAdmin = user?.role === 'ADMIN';
  const [activeSection, setActiveSection] = useState<'general' | 'agency' | 'refData' | 'appearance' | 'notifications' | 'security'>('general');
  const [preferences, setPreferences] = useState<SettingsPreferences>(() => loadSettingsPreferences());

  const { data: settings, isLoading } = useQuery({
    queryKey: ['agency-settings'],
    queryFn: () => api.get<AgencySettings>('/agency-settings'),
  });

  const [form, setForm] = useState<AgencySettings>(() => normalizeAgencySettings(settings));
  const [profileOpen, setProfileOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  });
  const [managerForm, setManagerForm] = useState<CreateManagerRequest>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (settings) {
      setForm(normalizeAgencySettings(settings));
    }
  }, [settings]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
  }, [queryClient]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [user]);

  useEffect(() => {
    saveSettingsPreferences(preferences);
  }, [preferences]);

  const settingsMutation = useMutation({
    mutationFn: (data: AgencySettings) => api.put<AgencySettings>('/agency-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-settings'] });
      toast.success(t('settings:saved'));
    },
    onError: () => {
      toast.error(t('settings:saveError'));
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth', 'profile'], updatedUser);
      toast.success(t('settings:profileUpdated'));
      setProfileOpen(false);
    },
    onError: () => {
      toast.error(t('settings:profileSaveError'));
    },
  });

  const managerMutation = useMutation({
    mutationFn: (data: CreateManagerRequest) => authService.createManager(data),
    onSuccess: () => {
      toast.success(t('settings:managerCreated'));
      setManagerForm({ firstName: '', lastName: '', email: '', password: '' });
      setManagerOpen(false);
    },
    onError: () => {
      toast.error(t('settings:managerCreateError'));
    },
  });

  const handleSave = () => {
    settingsMutation.mutate(form);
  };

  const updatePreference = <K extends keyof SettingsPreferences>(key: K, value: SettingsPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    profileMutation.mutate({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
    });
  };

  const handleManagerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    managerMutation.mutate({
      firstName: managerForm.firstName.trim(),
      lastName: managerForm.lastName.trim(),
      email: managerForm.email.trim(),
      password: managerForm.password,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">
            {t('settings:title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('settings:subtitle')}</p>
        </div>
        <Button onClick={handleSave} disabled={settingsMutation.isPending}>
          {settingsMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t('settings:save')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-2">
            {[
              { key: 'general', icon: SlidersHorizontal, label: t('settings:general') },
              { key: 'agency', icon: Building, label: t('settings:agency') },
              { key: 'refData', icon: Globe, label: t('settings:refData') },
              { key: 'appearance', icon: Monitor, label: t('settings:appearance') },
              { key: 'notifications', icon: Bell, label: t('settings:notifications') },
              { key: 'security', icon: ShieldCheck, label: t('settings:security') },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.key}
                  type="button"
                  variant={activeSection === section.key ? 'default' : 'ghost'}
                  className="gap-2"
                  onClick={() => setActiveSection(section.key as typeof activeSection)}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </Button>
              );
            })}
          </div>

          {activeSection === 'general' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5" />
                    {t('settings:language')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">{t('settings:languageSubtitle')}</p>
                  <div className="flex flex-wrap gap-2">
                    {languageOptions.map((opt) => (
                      <Button
                        key={opt.code}
                        variant={language === opt.code ? 'default' : 'outline'}
                        onClick={() => setLanguage(opt.code)}
                      >
                        {opt.nativeLabel}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <SlidersHorizontal className="h-5 w-5" />
                    {t('settings:workspacePreferences')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{t('settings:compactMode')}</p>
                      <p className="text-sm text-muted-foreground">{t('settings:compactModeSubtitle')}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.compactMode}
                      onChange={(event) => updatePreference('compactMode', event.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{t('settings:autoRefresh')}</p>
                      <p className="text-sm text-muted-foreground">{t('settings:autoRefreshSubtitle')}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.autoRefresh}
                      onChange={(event) => updatePreference('autoRefresh', event.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCog className="h-5 w-5" />
                    {t('settings:account')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <p className="text-xs uppercase text-muted-foreground">{user?.role}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setProfileOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('settings:editProfile')}
                      </Button>
                      {isAdmin && (
                        <Button onClick={() => setManagerOpen(true)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          {t('settings:createManager')}
                        </Button>
                      )}
                    </div>
                  </div>

                  <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                    <DialogContent>
                      <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <DialogHeader>
                          <DialogTitle>{t('settings:editProfile')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="profile-first-name">{t('settings:firstName')}</Label>
                          <Input
                            id="profile-first-name"
                            value={profileForm.firstName}
                            maxLength={50}
                            required
                            onChange={(event) =>
                              setProfileForm({ ...profileForm, firstName: event.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-last-name">{t('settings:lastName')}</Label>
                          <Input
                            id="profile-last-name"
                            value={profileForm.lastName}
                            maxLength={50}
                            required
                            onChange={(event) =>
                              setProfileForm({ ...profileForm, lastName: event.target.value })
                            }
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>
                            {t('dialog:cancel')}
                          </Button>
                          <Button type="submit" disabled={profileMutation.isPending}>
                            {profileMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {profileMutation.isPending ? t('settings:updating') : t('settings:save')}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {isAdmin && (
                    <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
                      <DialogContent>
                        <form onSubmit={handleManagerSubmit} className="space-y-4">
                          <DialogHeader>
                            <DialogTitle>{t('settings:newManager')}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="manager-first-name">{t('settings:firstName')}</Label>
                              <Input
                                id="manager-first-name"
                                value={managerForm.firstName}
                                maxLength={50}
                                required
                                onChange={(event) =>
                                  setManagerForm({ ...managerForm, firstName: event.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="manager-last-name">{t('settings:lastName')}</Label>
                              <Input
                                id="manager-last-name"
                                value={managerForm.lastName}
                                maxLength={50}
                                required
                                onChange={(event) =>
                                  setManagerForm({ ...managerForm, lastName: event.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manager-email">{t('settings:email')}</Label>
                            <Input
                              id="manager-email"
                              type="email"
                              value={managerForm.email}
                              required
                              onChange={(event) =>
                                setManagerForm({ ...managerForm, email: event.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manager-password">{t('settings:password')}</Label>
                            <Input
                              id="manager-password"
                              type="password"
                              value={managerForm.password}
                              minLength={8}
                              maxLength={128}
                              required
                              onChange={(event) =>
                                setManagerForm({ ...managerForm, password: event.target.value })
                              }
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setManagerOpen(false)}
                            >
                              {t('dialog:cancel')}
                            </Button>
                            <Button type="submit" disabled={managerMutation.isPending}>
                              {managerMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {managerMutation.isPending
                                ? t('settings:creating')
                                : t('settings:createManager')}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'agency' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  {t('settings:agencyInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings:agencyName')}</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.agencyName}
                      onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                      className="pl-9"
                      placeholder={t('settings:agencyNamePlaceholder')}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings:address')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="pl-9"
                      placeholder={t('settings:addressPlaceholder')}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings:phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="pl-9"
                      placeholder={t('settings:phonePlaceholder')}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings:email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="pl-9"
                      placeholder={t('settings:emailPlaceholder')}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings:website')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="pl-9"
                      placeholder={t('settings:websitePlaceholder')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'refData' && <RefDataSettings />}

          {activeSection === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5" />
                  {t('settings:appearance')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('settings:appearanceSubtitle')}</p>
                <div className="flex flex-wrap gap-2">
                  {(['light', 'dark', 'system'] as const).map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={theme === option ? 'default' : 'outline'}
                      onClick={() => setTheme(option)}
                    >
                      {t(`settings:${option}`)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5" />
                  {t('settings:notifications')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{t('settings:emailNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings:emailNotificationsSubtitle')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(event) => updatePreference('emailNotifications', event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{t('settings:smsNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings:smsNotificationsSubtitle')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.smsNotifications}
                    onChange={(event) => updatePreference('smsNotifications', event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                </label>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5" />
                  {t('settings:security')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{t('settings:destructiveActionConfirmation')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings:destructiveActionConfirmationSubtitle')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.destructiveActionConfirmation}
                    onChange={(event) => updatePreference('destructiveActionConfirmation', event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                </label>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
