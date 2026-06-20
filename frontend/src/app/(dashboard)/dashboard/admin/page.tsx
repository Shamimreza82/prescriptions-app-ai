'use client';

import { useAdminDashboard } from '@/features/dashboard/hooks';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { Users, Activity, DollarSign, Shield, Clock } from 'lucide-react';

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

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Total Doctors" value={stats?.totalDoctors || 0} icon={Users} gradient="gradient-primary" />
        <StatsCard title="Active Doctors" value={stats?.activeDoctors || 0} icon={Activity} gradient="gradient-success" />
        <StatsCard title="Total Patients" value={stats?.totalPatients || 0} icon={Shield} gradient="gradient-info" />
        <StatsCard title="Pending Subs" value={stats?.pendingSubscriptions || 0} icon={Clock} gradient="gradient-warning" />
        <StatsCard title="Revenue" value={`${stats?.totalRevenue || 0}`} icon={DollarSign} gradient="gradient-warning" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="premium-card-static p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Plan Distribution</h3>
          {stats?.planDistribution?.length ? (
            <div className="space-y-4">
              {stats.planDistribution.map((p) => (
                <div key={p.plan} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.plan}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.plan === 'Premium' || p.plan === 'premium' ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                        style={{ width: `${stats.totalDoctors ? (p._count / stats.totalDoctors) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{p._count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subscriptions yet</p>
          )}
        </div>

        <div className="premium-card-static p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Subscription Status</h3>
          {stats?.subscriptionStatusDistribution?.length ? (
            <div className="space-y-4">
              {stats.subscriptionStatusDistribution.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.status}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-400 to-green-600' : s.status === 'EXPIRED' ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-600'}`}
                        style={{ width: `${(s._count / (stats.totalDoctors || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{s._count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </div>

        <div className="premium-card-static p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Prescriptions', value: stats?.totalPrescriptions || 0 },
              { label: 'Active Doctors', value: `${stats?.activeDoctors || 0} / ${stats?.totalDoctors || 0}` },
              { label: 'Total Patients', value: stats?.totalPatients || 0 },
              { label: 'Plan Distribution', value: stats?.planDistribution?.map(p => `${p.plan}: ${p._count}`).join(', ') || '0' },
            ].map((item, i) => (
              <div key={item.label} className={`flex justify-between items-center py-2 ${i < 3 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}