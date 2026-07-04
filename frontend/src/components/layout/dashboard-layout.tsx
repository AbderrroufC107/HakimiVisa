import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 overflow-y-auto p-4 md:p-6 outline-none',
            'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent',
          )}
        >
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
