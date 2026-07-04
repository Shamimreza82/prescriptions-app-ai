'use client';

import { useDashboardStats } from '@/features/mr/hooks';
import { Card } from '@/components/ui/card';
import { FileText, Activity, UserRound, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function MrDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  const chartData = stats?.weeklyLabels?.map((label: string, i: number) => ({
    day: label,
    count: stats.weeklyPrescriptions?.[i] || 0,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MR Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your assigned doctors</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-glow shrink-0">
              <UserRound className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned Doctors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalDoctors || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-glow shrink-0">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalPrescriptions || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-glow shrink-0">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today&apos;s Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.todaysPrescriptions || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 premium-card-static">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              <TrendingUp className="h-4 w-4 inline mr-1.5 text-indigo-500" />
              Last 7 Days Prescription Trend
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily prescription count across all assigned doctors</p>
          </div>
          <Link
            href="/dashboard/mr/reports"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View Reports <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {chartData.length > 0 ? (
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', padding: '6px 10px' }}
                  formatter={(value: any) => [value, 'Prescriptions']}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
        )}
      </Card>
    </div>
  );
}
