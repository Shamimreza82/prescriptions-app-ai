'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, getUser } from '@/lib/utils';
import { useLogout } from '@/features/auth/hooks';
import {
  LayoutDashboard, Users, FileText, Calendar, Building2,
  LogOut, Sun, Moon, Stethoscope, ChevronLeft, ChevronRight,
  Shield, UserCog, CreditCard, PersonStanding, ClipboardList, UserRound, Crown, Settings, ChevronDown, BarChart3,
} from 'lucide-react';
import { useThemeContext } from '@/providers/theme-provider';

const navActiveColor = 'from-blue-600 to-indigo-600';
const navChildActiveColor = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30';

const doctorMenu = [
  { href: '/dashboard/doctor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/prescriptions', label: 'Prescriptions', icon: FileText },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/doctor/receptionists', label: 'Receptionists', icon: UserRound },
  {
    label: 'Settings', icon: Settings,
    children: [
      { href: '/dashboard/doctor/settings/plans', label: 'Plans', icon: Crown },
      { href: '/dashboard/doctor/settings/change-password', label: 'Change Password', icon: Shield },
    ],
  },
  { href: '/dashboard/doctor/profile', label: 'My Profile', icon: Building2 },
];

const adminMenu = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: Shield },
  { href: '/dashboard/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/dashboard/admin/patients', label: 'Patients', icon: PersonStanding },
  { href: '/dashboard/admin/users', label: 'Users', icon: UserCog },
  { href: '/dashboard/admin/medical-reps', label: 'Medical Reps', icon: UserRound },
  { href: '/dashboard/admin/plans', label: 'Plans', icon: Crown },
  {
    label: 'Subscriptions', icon: CreditCard,
    children: [
      { href: '/dashboard/admin/subscriptions', label: 'All Subscriptions', icon: CreditCard },
      { href: '/dashboard/admin/subscriptions/pending', label: 'Pending Subs', icon: CreditCard },
    ],
  },
  { href: '/dashboard/admin/logs', label: 'Activity Logs', icon: ClipboardList },
];

const mrMenu = [
  { href: '/dashboard/mr', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/mr/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/dashboard/mr/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/mr/subscriptions', label: 'Subscriptions', icon: Crown },
  { href: '/dashboard/mr/profile', label: 'My Profile', icon: UserRound },
];

const recMenu = [
  { href: '/dashboard/receptionist', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/receptionist/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/receptionist/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/receptionist/prescriptions', label: 'Prescriptions', icon: FileText },
];

interface MenuChild {
  href: string;
  label: string;
  icon: any;
}

interface MenuItem {
  href?: string;
  label: string;
  icon: any;
  children?: MenuChild[];
}

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const logout = useLogout();
  const { theme, toggle } = useThemeContext();

  useEffect(() => { setMounted(true); }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const closeMobile = () => setMobileOpen(false);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const user = mounted ? getUser() : null;
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isMr = user?.role === 'MEDICAL_REPRESENTATIVE';
  const isRec = user?.role === 'RECEPTIONIST';
  const menuItems: MenuItem[] = isAdmin ? adminMenu : isMr ? mrMenu : isRec ? recMenu : doctorMenu;

  const renderMenuItem = (item: MenuItem) => {
    if (item.children) {
      const isExpanded = expandedMenus[item.label];
      const childActive = item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));

      return (
        <div key={item.label}>
          <button
            onClick={() => !collapsed && toggleMenu(item.label)}
            className={cn(
              'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 w-full',
              collapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-2.5',
              childActive
                ? 'text-white bg-gradient-to-r ' + navActiveColor
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className={cn('h-5 w-5 shrink-0', childActive ? 'text-white' : '')} />
            {!collapsed && (
              <>
                <span className="truncate flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isExpanded ? 'rotate-0' : '-rotate-90')}
                />
              </>
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="ml-3 mt-1 space-y-1 border-l border-gray-100 dark:border-gray-800/50 pl-3">
              {item.children.map((child) => {
                const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 py-2 px-3',
                      isChildActive
                        ? navChildActiveColor
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <child.icon className={cn('h-4 w-4 shrink-0')} />
                    <span className="truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const Icon = item.icon;
    const isActive = isAdmin || isMr || isRec
      ? pathname === item.href || (item.href !== '/dashboard/admin' && item.href !== '/dashboard/mr' && item.href !== '/dashboard/receptionist' && pathname.startsWith(item.href + '/'))
      : pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <div key={`${item.href}-${item.label}`} title={collapsed ? item.label : undefined}>
        <Link
          href={item.href!}
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative group',
            collapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-2.5',
            isActive
              ? 'text-white bg-gradient-to-r ' + navActiveColor
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
          )}
        >
          <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-white' : '')} />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {isActive && !collapsed && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
          )}
        </Link>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={closeMobile} />
      )}

      {/* Hamburger button (visible on mobile) */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={cn(
          'fixed top-3 z-50 lg:hidden w-10 h-10 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300',
          mobileOpen ? 'left-[228px]' : 'left-3'
        )}
        aria-label="Toggle menu"
      >
        <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800/50 min-h-screen transition-all duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          collapsed && !mobileOpen ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {/* Brand */}
        <div className={cn('p-4 border-b border-gray-100 dark:border-gray-800/50 flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl gradient-primary shadow-glow flex items-center justify-center shrink-0">
                {isAdmin ? <Shield className="h-5 w-5 text-white" /> : isMr ? <UserRound className="h-5 w-5 text-white" /> : isRec ? <Users className="h-5 w-5 text-white" /> : <Stethoscope className="h-5 w-5 text-white" />}
              </div>
              <div className="truncate">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">Prescribe Pro</h1>
                <p className="text-xs text-muted-foreground truncate">{isAdmin ? 'Admin Portal' : isMr ? 'MR Portal' : isRec ? 'Reception Portal' : (user?.doctor?.clinicName || 'Doctor Portal')}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
              {isAdmin ? <Shield className="h-5 w-5 text-white" /> : isMr ? <UserRound className="h-5 w-5 text-white" /> : isRec ? <Users className="h-5 w-5 text-white" /> : <Stethoscope className="h-5 w-5 text-white" />}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map(renderMenuItem)}
        </nav>

        {/* Footer */}
        <div className={cn('p-4 border-t border-gray-100 dark:border-gray-800/50 space-y-2', collapsed ? 'flex flex-col items-center' : '')}>
          <button
            onClick={toggle}
            className={cn(
              'flex items-center gap-3 rounded-xl text-sm transition-all',
              collapsed
                ? 'justify-center p-3 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800/50'
                : 'w-full px-3.5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
            )}
            title={collapsed ? 'Toggle theme' : undefined}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={() => logout.mutate()}
            className={cn(
              'flex items-center gap-3 rounded-xl text-sm transition-all text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30',
              collapsed ? 'justify-center p-3' : 'w-full px-3.5 py-2.5'
            )}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
