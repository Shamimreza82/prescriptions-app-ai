import { FileText, Users, Calendar, BarChart3, UserCog, Shield } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Digital Prescriptions',
    description:
      'Create and manage prescriptions digitally with QR-coded PDFs. Print, share, or store them securely with automated refill tracking and medication history.',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Users,
    title: 'Patient Management',
    description:
      'Comprehensive patient records with medical history, allergies, medications, and treatment notes. Quick search and instant access to complete profiles.',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Calendar,
    title: 'Appointment Scheduling',
    description:
      'Smart calendar with automated reminders, status tracking, and real-time availability. Reduce no-shows and keep your schedule organized.',
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description:
      'Revenue dashboards, patient demographics, prescription trends, and clinic performance metrics. Make data-driven decisions for your practice.',
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: UserCog,
    title: 'Multi-Role Access',
    description:
      'Role-based dashboards for Admins, Doctors, Receptionists, and Medical Representatives. Granular permissions ensure secure and efficient workflows.',
    color: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    icon: Shield,
    title: 'Secure & Compliant',
    description:
      'JWT authentication, encrypted data, audit logging, automated database backups, and role-based access control. Your data stays safe and compliant.',
    color: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Everything you need to{' '}
            <span className="text-gradient">manage your practice</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed to streamline your workflow and improve patient care.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group glass-strong rounded-2xl p-6 hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
