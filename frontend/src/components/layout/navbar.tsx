import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useAuth, useSocket } from '@/providers';
import { useTheme } from '@/providers';
import { notificationsService, searchService } from '@/services';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants';
import { Bell, LogOut, Moon, Settings, Sun, User, CheckCheck, Search, Users, FileText, Calendar } from 'lucide-react';
import type { Notification } from '@/types';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const dateLocale = i18n.language?.startsWith('fr') ? fr : enUS;
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsService.getUnreadCount,
    refetchInterval: 30000,
  });

  const { data: recentData } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsService.findAll(1, 5),
  });

  useEffect(() => {
    if (!socket) return;
    const handler = (_notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [socket, queryClient]);

  const unreadCount = unreadCountData ?? 0;
  const recentNotifications = recentData?.data ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocusIdx, setSearchFocusIdx] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchService.search(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '??';

  const searchTypeIcon: Record<string, typeof Search> = {
    client: Users,
    'visa-case': FileText,
    appointment: Calendar,
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={searchOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="search-results"
          className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={t('nav:searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchFocusIdx(-1);
            if (e.target.value.length >= 2) setSearchOpen(true);
          }}
          onFocus={() => { if (searchQuery.length >= 2) setSearchOpen(true); }}
          onKeyDown={(e) => {
            const allResults = [
              ...(searchResults?.clients ?? []),
              ...(searchResults?.visaCases ?? []),
              ...(searchResults?.appointments ?? []),
            ];
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSearchFocusIdx((prev) => Math.min(prev + 1, allResults.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSearchFocusIdx((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && searchFocusIdx >= 0 && allResults[searchFocusIdx]) {
              e.preventDefault();
              navigate(allResults[searchFocusIdx].href);
              setSearchOpen(false);
              setSearchQuery('');
            } else if (e.key === 'Escape') {
              setSearchOpen(false);
              inputRef.current?.blur();
            }
          }}
        />
        {searchOpen && searchQuery.length >= 2 && searchResults && (
          <div id="search-results" role="listbox" className="absolute top-full mt-1 w-full rounded-md border bg-background shadow-lg z-50 animate-fade-in">
            {searchResults.clients.length === 0 &&
             searchResults.visaCases.length === 0 &&
             searchResults.appointments.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t('nav:noSearchResults')} <span className="font-medium">"{searchQuery}"</span>
              </div>
            ) : (
              <>
                {searchResults.clients.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('nav:clientsSection')}</div>
                    {searchResults.clients.map((r, idx) => {
                      const Icon = searchTypeIcon[r.type] ?? Search;
                      const globalIdx = idx;
                      return (
                        <button
                          key={r.id}
                          role="option"
                          aria-selected={searchFocusIdx === globalIdx}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                            searchFocusIdx === globalIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                          }`}
                          onClick={() => { navigate(r.href); setSearchOpen(false); setSearchQuery(''); }}
                        >
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{r.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{r.sublabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {searchResults.visaCases.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('nav:casesSection')}</div>
                    {searchResults.visaCases.map((r, idx) => {
                      const Icon = searchTypeIcon[r.type] ?? Search;
                      const globalIdx = (searchResults.clients?.length ?? 0) + idx;
                      return (
                        <button
                          key={r.id}
                          role="option"
                          aria-selected={searchFocusIdx === globalIdx}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                            searchFocusIdx === globalIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                          }`}
                          onClick={() => { navigate(r.href); setSearchOpen(false); setSearchQuery(''); }}
                        >
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{r.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{r.sublabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {searchResults.appointments.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('nav:appointmentsSection')}</div>
                    {searchResults.appointments.map((r, idx) => {
                      const Icon = searchTypeIcon[r.type] ?? Search;
                      const globalIdx = (searchResults.clients?.length ?? 0) + (searchResults.visaCases?.length ?? 0) + idx;
                      return (
                        <button
                          key={r.id}
                          role="option"
                          aria-selected={searchFocusIdx === globalIdx}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                            searchFocusIdx === globalIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                          }`}
                          onClick={() => { navigate(r.href); setSearchOpen(false); setSearchQuery(''); }}
                        >
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{r.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{r.sublabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={bellRef}
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>{t('nav:notificationsTitle')}</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={async () => {
                  await notificationsService.markAllAsRead();
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                }}
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                {t('nav:markAllRead')}
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-72 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t('nav:noNotifications')}
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={`flex flex-col items-start px-4 py-3 ${
                    !notif.read ? 'bg-primary/5 font-medium' : ''
                  }`}
                  onSelect={() => {
                    if (notif.link) navigate(notif.link);
                    else navigate(ROUTES.NOTIFICATIONS);
                  }}
                >
                  <span className="text-sm">{notif.title}</span>
                  <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {notif.message}
                  </span>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="justify-center text-sm font-medium"
            onSelect={() => navigate(ROUTES.NOTIFICATIONS)}
          >
            {t('nav:viewAllNotifications')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline-block">
              {user?.firstName} {user?.lastName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
            <User className="mr-2 h-4 w-4" />
            {t('nav:profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
            <Settings className="mr-2 h-4 w-4" />
            {t('nav:settings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('nav:logOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
