import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-10 sm:p-16 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to transform your practice?
            </h2>
            <p className="text-lg text-blue-100 max-w-xl mx-auto mb-8">
              Join thousands of healthcare professionals who trust Prescribe Pro.
              Get started free — no credit card required.
            </p>
            <Link href="/auth/register">
              <Button
                size="lg"
                className="h-12 px-8 rounded-xl bg-white text-blue-700 hover:bg-blue-50 shadow-lg text-base font-semibold"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
