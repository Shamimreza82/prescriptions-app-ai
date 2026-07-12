'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Stethoscope, FileText, Shield, Users } from 'lucide-react';

const stats = [
  { icon: FileText, label: 'Prescriptions Generated', value: '10,000+' },
  { icon: Users, label: 'Active Doctors', value: '500+' },
  { icon: Shield, label: 'Uptime', value: '99.9%' },
  { icon: Stethoscope, label: 'Patient Records', value: '50,000+' },
];

const highlights = [
  {
    title: 'Our Mission',
    content:
      'Prescribe Pro was built to simplify healthcare management. We empower doctors and clinics with modern digital tools that reduce paperwork, minimize errors, and let them focus on what matters most — patient care.',
  },
  {
    title: 'Who We Serve',
    content:
      'From solo practitioners to multi-specialty clinics, our platform supports doctors, receptionists, medical representatives, and administrators with role-specific dashboards and workflows.',
  },
  {
    title: 'Why Choose Us',
    content:
      'Unlike generic practice management software, Prescribe Pro is purpose-built for the modern healthcare environment. We combine powerful features with an intuitive interface, enterprise-grade security, and dedicated support.',
  },
];

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white animate-fade-in">
            About{' '}
            <span className="text-gradient">Prescribe Pro</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up">
            Empowering healthcare professionals with modern tools to streamline practice management and improve patient care.
          </p>
        </div>
      </div>

      {/* Stats */}
      <section className="relative z-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-strong rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div key={item.title} className="glass-strong rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{item.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-10 sm:p-16 text-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Start your journey today
              </h2>
              <p className="text-lg text-blue-100 max-w-xl mx-auto mb-8">
                Join the growing community of healthcare professionals using Prescribe Pro.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-blue-700 hover:bg-blue-50 shadow-lg text-base font-semibold">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
