import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants';
import {
  LayoutDashboard,
  Users,
  FileText,
  KanbanSquare,
  Calendar,
  Bell,
  ScrollText,
  FileDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  Activity,
  FileWarning,
  CheckCircle,
  MessageSquareText,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();

  const mainNavItems: NavItem[] = [
    { label: t('nav:dashboard'), href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t('nav:clients'), href: ROUTES.CLIENTS, icon: Users },
    { label: t('nav:visaCases'), href: ROUTES.VISA_CASES, icon: FileText },
    { label: t('nav:visaDecisions'), href: ROUTES.VISA_DECISIONS, icon: CheckCircle },
    { label: t('nav:kanbanBoard'), href: ROUTES.KANBAN, icon: KanbanSquare },
    { label: t('nav:appointments'), href: ROUTES.APPOINTMENTS, icon: Calendar },
  ];

  const secondaryNavItems: NavItem[] = [
    { label: t('nav:templates'), href: ROUTES.TEMPLATES, icon: MessageSquareText },
    { label: t('nav:notifications'), href: ROUTES.NOTIFICATIONS, icon: Bell },
    { label: t('nav:auditLogs'), href: ROUTES.AUDIT_LOGS, icon: ScrollText },
    { label: t('nav:pdfPrinting'), href: ROUTES.PDF, icon: FileDown },
    { label: 'Managers', href: ROUTES.USERS, icon: Users },
    { label: t('nav:backupCenter'), href: ROUTES.BACKUP_CENTER, icon: Database },
    { label: t('nav:systemHealth'), href: ROUTES.SYSTEM_HEALTH, icon: Activity },
    { label: t('nav:systemLogs'), href: ROUTES.SYSTEM_LOGS, icon: FileWarning },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HV" className="h-8 w-auto" />
            <span className="text-lg font-semibold tracking-tight">HakimiVisa</span>
          </div>
        )}
        {collapsed && (
          <img src="/logo.png" alt="HV" className="h-8 w-auto mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('text-sidebar-foreground/60 hover:text-sidebar-foreground', collapsed ? 'mx-auto mt-2' : 'ml-auto')}
          aria-label={collapsed ? t('nav:expandMenu') : t('nav:collapseMenu')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-2">
        <SidebarSection label={t('nav:main')} collapsed={collapsed}>
          {mainNavItems.map((item) => (
            <SidebarLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </SidebarSection>

        <Separator className="my-2" />

        <SidebarSection label={t('nav:tools')} collapsed={collapsed}>
          {secondaryNavItems.map((item) => (
            <SidebarLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </SidebarSection>
      </nav>

      <Separator />

      <div className="p-2">
        <SidebarLink
          item={{ label: t('nav:settings'), href: ROUTES.SETTINGS, icon: Settings }}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}

interface SidebarSectionProps {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}

function SidebarSection({ label, collapsed, children }: SidebarSectionProps) {
  return (
    <div>
      {!collapsed && (
        <p className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  collapsed: boolean;
}

function SidebarLink({ item, collapsed }: SidebarLinkProps) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
          collapsed && 'justify-center px-2',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
          )}
          <item.icon className={cn('h-4 w-4 shrink-0 transition-transform', !collapsed && 'group-hover:scale-110')} />
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}
