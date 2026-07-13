'use client';

import { useAdminDashboard } from '@/features/dashboard/hooks';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { PlanDistributionChart, SubscriptionStatusChart, KeyMetricsChart } from '@/features/dashboard/components/AdminCharts';
import { Users, Activity, DollarSign, Shield, Clock, UserCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and analytics</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
        <StatsCard title="Total Doctors" value={stats?.totalDoctors || 0} icon={Users} gradient="gradient-primary" />
        <StatsCard title="Active Doctors" value={stats?.activeDoctors || 0} icon={Activity} gradient="gradient-success" />
        <StatsCard title="Pending Verification" value={stats?.pendingVerification || 0} icon={UserCheck} gradient="gradient-warning" />
        <StatsCard title="Total Patients" value={stats?.totalPatients || 0} icon={Shield} gradient="gradient-info" />
        <StatsCard title="Pending Subs" value={stats?.pendingSubscriptions || 0} icon={Clock} gradient="gradient-warning" />
        <StatsCard title="Revenue" value={`${stats?.totalRevenue || 0}`} icon={DollarSign} gradient="gradient-warning" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <PlanDistributionChart data={stats?.planDistribution || []} />
        <SubscriptionStatusChart data={stats?.subscriptionStatusDistribution || []} />
        <KeyMetricsChart
          activeDoctors={stats?.activeDoctors || 0}
          totalPatients={stats?.totalPatients || 0}
          totalPrescriptions={stats?.totalPrescriptions || 0}
        />
      </div>
    </div>
  );
}