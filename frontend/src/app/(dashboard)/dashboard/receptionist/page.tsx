'use client';

import { useRecDashboard } from '@/features/receptionist/hooks';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { MonthlyChart } from '@/features/dashboard/components/MonthlyChart';
import { Users, FileText, Calendar, Activity, Clock, UserPlus, List, Pill } from 'lucide-react';
import Link from 'next/link';

export default function ReceptionistDashboardPage() {
  const { data: stats, isLoading } = useRecDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 h-72 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-72 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'Today Patients', value: stats?.todaysPatients || 0, icon: UserPlus, gradient: 'gradient-info', delay: 0 },
    { title: 'Today Rx', value: stats?.todaysPrescriptions || 0, icon: Pill, gradient: 'gradient-primary', delay: 0.1 },
    { title: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, gradient: 'gradient-primary', delay: 0.2 },
    { title: 'Total Prescriptions', value: stats?.totalPrescriptions || 0, icon: FileText, gradient: 'gradient-success', delay: 0.3 },
    { title: 'Monthly Appointments', value: stats?.monthlyAppointments || 0, icon: Calendar, gradient: 'gradient-warning', delay: 0.4 },
    { title: 'This Month Rx', value: stats?.monthlyPrescriptions || 0, icon: Activity, gradient: 'gradient-info', delay: 0.5 },
  ];

  const gridCols = 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reception Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of the practice</p>
      </div>

      <div className={`grid gap-5 ${gridCols}`}>
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {stats?.monthlyData && <MonthlyChart data={stats.monthlyData} />}
        </div>

        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="premium-card-static p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Quick Actions
            </h3>
            <div className="space-y-2.5">
              <QuickAction icon={UserPlus} label="Register New Patient" href="/dashboard/receptionist/patients/new" color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/30" />
              <QuickAction icon={Calendar} label="Schedule Appointment" href="/dashboard/receptionist/appointments" color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/30" />
              <QuickAction icon={List} label="View Appointments" href="/dashboard/receptionist/appointments" color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/30" />
            </div>
          </div>

          {/* Today's Mini Calendar */}
          <div className="premium-card-static p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-amber-500" /> Today
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {new Date().toLocaleDateString('en-US', { day: 'numeric' })}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
              <Link href="/dashboard/receptionist/appointments" className="flex items-center justify-between text-sm group">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {stats?.monthlyAppointments || 0} appointments this month
                </span>
                <span className="text-primary text-xs font-medium">View all →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href, color, bg }: { icon: any; label: string; href: string; color: string; bg: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <div className={`p-2.5 rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </Link>
  );
}
