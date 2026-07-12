'use client';

import HeroSection from '@/components/landing/hero-section';
import FeaturesSection from '@/components/landing/features-section';
import CtaSection from '@/components/landing/cta-section';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/20 to-indigo-100/20 dark:from-blue-900/5 dark:to-indigo-900/5 rounded-full blur-3xl hidden sm:block" />
      </div>

      <div className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
      </div>
    </div>
  );
}
