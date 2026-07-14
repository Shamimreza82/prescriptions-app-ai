'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeContext } from '@/providers/theme-provider';
import { useLogout } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { getAuthToken, getUser } from '@/lib/utils';
import MobileNav from '@/components/landing/mobile-nav';
import { Stethoscope, Sun, Moon, Menu, X, LayoutDashboard, LogOut, User } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const dashboardHref = {
  SUPER_ADMIN: '/dashboard/admin',
  MEDICAL_REPRESENTATIVE: '/dashboard/mr',
  RECEPTIONIST: '/dashboard/receptionist',
} as Record<string, string>;

export default function LandingNavbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { theme, toggle } = useThemeContext();
  const logout = useLogout();

  useEffect(() => { setMounted(true); }, []);

  const user = mounted ? getUser() : null;
  const token = mounted ? getAuthToken() : null;
  const isLoggedIn = !!user && !!token;
  const dashLink = isLoggedIn ? (dashboardHref[user.role] || '/dashboard/doctor') : null;

  const profileImgUrl = isLoggedIn && user?.doctor?.profileImg
    ? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000/uploads/${user.doctor.profileImg}`
    : null;

  const avatarInitial = isLoggedIn
    ? user?.doctor?.fullName?.charAt(0)
      || user?.mr?.fullName?.charAt(0)
      || user?.receptionist?.fullName?.charAt(0)
      || user?.email?.charAt(0).toUpperCase()
      || 'U'
    : 'U';

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
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={isLoggedIn ? dashLink! : '/'} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gradient">MediCloud</span>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[0.5px] after:w-full after:bg-current after:origin-left after:transition-transform after:duration-300 ${
                    pathname === link.href
                      ? 'text-blue-600 dark:text-blue-400 after:scale-x-100'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 after:scale-x-0 hover:after:scale-x-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isLoggedIn ? (
              <div className="relative hidden sm:block" ref={avatarRef}>
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="w-9 h-9 rounded-xl gradient-primary shadow-glow flex items-center justify-center text-white text-sm font-semibold cursor-pointer overflow-hidden"
                >
                  {profileImgUrl ? (
                    <img src={profileImgUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </button>
                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
                    <Link
                      href={dashLink!}
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
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
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:inline-flex">
                  <Button variant="outline" size="sm" className="rounded-xl border-2">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" className="hidden sm:inline-flex">
                  <Button size="sm" className="rounded-xl gradient-primary text-white shadow-glow">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

    </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
        isLoggedIn={isLoggedIn}
        dashLink={dashLink}
        onLogout={() => logout.mutate()}
      />
    </>
  );
}
