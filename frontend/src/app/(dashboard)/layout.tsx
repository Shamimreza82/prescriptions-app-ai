'use client';

import { useAuthGuard } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/contexts/sidebar-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard();

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50/50 dark:bg-gray-950/50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
