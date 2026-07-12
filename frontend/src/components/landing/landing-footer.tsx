import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/auth/login', label: 'Sign In' },
  { href: '/auth/register', label: 'Register' },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gradient">Prescribe Pro</span>
          </Link>

          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Prescribe Pro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
