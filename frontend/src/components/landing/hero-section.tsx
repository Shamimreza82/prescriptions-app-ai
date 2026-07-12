import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-sm text-blue-700 dark:text-blue-300 font-medium mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-soft" />
          Trusted by 500+ healthcare professionals
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight animate-slide-up">
          Modern Prescription Management
          <br />
          <span className="text-gradient">for Healthcare Professionals</span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Streamline your practice with digital prescriptions, comprehensive patient records,
          appointment scheduling, and powerful analytics — all in one secure platform.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link href="/auth/register">
            <Button size="lg" className="h-12 px-8 rounded-xl gradient-primary text-white shadow-glow text-base">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl border-2 text-base">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
