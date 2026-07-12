'use client';

import LandingNavbar from '@/components/landing/landing-navbar';
import LandingFooter from '@/components/landing/landing-footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen">{children}</main>
      <LandingFooter />
    </>
  );
}
