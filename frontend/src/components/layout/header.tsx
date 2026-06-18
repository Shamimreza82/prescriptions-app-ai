'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/utils';
import { Bell, Shield, Plus } from 'lucide-react';

export const Header = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const user = mounted ? getUser() : null;
  const role = user?.role;

  const roleConfig: Record<string, { name: string; title: string; icon: React.ReactNode; initial: string }> = {
    SUPER_ADMIN: {
      name: 'Admin',
      title: 'System Administrator',
      icon: <Shield className="h-4 w-4" />,
      initial: 'A',
    },
    DOCTOR: {
      name: user?.doctor?.fullName?.split(' ')[0] || 'Doctor',
      title: (user?.doctor?.specialization || []).join(', ') || 'Doctor',
      icon: null,
      initial: user?.doctor?.fullName?.charAt(0) || 'D',
    },
    MEDICAL_REPRESENTATIVE: {
      name: user?.mr?.fullName?.split(' ')[0] || 'MR',
      title: 'Medical Representative',
      icon: null,
      initial: user?.mr?.fullName?.charAt(0) || 'M',
    },
    RECEPTIONIST: {
      name: user?.email?.split('@')[0] || 'User',
      title: 'Receptionist',
      icon: null,
      initial: user?.email?.charAt(0).toUpperCase() || 'R',
    },
  };

  const config = roleConfig[role as string] || roleConfig.RECEPTIONIST;

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Welcome back, <span className="text-gradient">{config.name}</span>
            </h2>
            <p className="text-xs text-muted-foreground">{config.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {role === 'DOCTOR' && (
            <Link
              href="/prescriptions/new"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-glow"
            >
              <Plus className="h-3.5 w-3.5" />
              Quick Prescription
            </Link>
          )}
          <button className="relative w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-primary text-[9px] font-bold text-white flex items-center justify-center shadow-glow">
              3
            </span>
          </button>
          <div className="w-9 h-9 rounded-xl gradient-primary shadow-glow flex items-center justify-center text-white text-sm font-semibold">
            {config.icon || config.initial}
          </div>
        </div>
      </div>
    </header>
  );
};
