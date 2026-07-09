'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/utils';
import { useLogout } from '@/features/auth/hooks';
import { Shield, Plus, User, LogOut } from 'lucide-react';

export const Header = () => {
  const [mounted, setMounted] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setDateTime(new Date());
    const timer = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const user = mounted ? getUser() : null;
  const role = user?.role;

  const hiddenSpecializations = [
    'Cardiology',
    'Rheumatology',
    'Hematology',
    'Pulmonology',
    'Neurology',
    'Cardiothoracic Surgery',
    'General Surgery',
    'Vascular Surgery',
    'Pediatric Surgery',
    'Urology',
    'Gynecology',
    'Emergency Medicine',
    'Family Medicine',
    'Infectious Disease',
    'Critical Care Medicine',
  ];

  const visibleSpecializations = (user?.doctor?.specialization || []).filter(
    (spec: string) => !hiddenSpecializations.includes(spec)
  );

  const roleConfig: Record<string, { name: string; title: string; icon: React.ReactNode; initial: string }> = {
    SUPER_ADMIN: {
      name: 'Admin',
      title: 'System Administrator',
      icon: <Shield className="h-4 w-4" />,
      initial: 'A',
    },
    DOCTOR: {
      name: user?.doctor?.fullName || 'Doctor',
      title: visibleSpecializations.join(', ') || 'Doctor',
      icon: null,
      initial: user?.doctor?.fullName?.charAt(0) || 'D',
    },
    MEDICAL_REPRESENTATIVE: {
      name: user?.mr?.fullName || 'MR',
      title: 'Medical Representative',
      icon: null,
      initial: user?.mr?.fullName?.charAt(0) || 'M',
    },
    RECEPTIONIST: {
      name: user?.receptionist?.fullName || user?.email?.split('@')[0] || 'User',
      title: 'Receptionist',
      icon: null,
      initial: user?.email?.charAt(0).toUpperCase() || 'R',
    },
  };

  const config = roleConfig[role as string] || roleConfig.RECEPTIONIST;

  const profileHref =
    role === 'DOCTOR' ? '/dashboard/doctor/profile' :
    role === 'MEDICAL_REPRESENTATIVE' ? '/dashboard/mr/profile' :
    '/dashboard/admin';

  const profileImgUrl = user?.doctor?.profileImg
    ? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000/uploads/${user.doctor.profileImg}`
    : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {dateTime && (
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {dateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
            </div>
          )}
          {role === 'DOCTOR' && (
            <Link
              href="/prescriptions/new"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-glow"
            >
              <Plus className="h-3.5 w-3.5" />
              Quick Prescription
            </Link>
          )}

          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="w-9 h-9 rounded-xl gradient-primary shadow-glow flex items-center justify-center text-white text-sm font-semibold cursor-pointer overflow-hidden"
            >
              {profileImgUrl ? (
                <img src={profileImgUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                config.icon || config.initial
              )}
            </button>
            {avatarOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
                <Link
                  href={profileHref}
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <hr className="border-gray-100 dark:border-gray-700 my-1" />
                <button
                  onClick={() => { setAvatarOpen(false); logout.mutate(); }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
