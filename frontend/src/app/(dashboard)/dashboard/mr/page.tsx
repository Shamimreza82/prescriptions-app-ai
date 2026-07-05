'use client';

import { useDashboardStats } from '@/features/mr/hooks';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Activity, UserRound, TrendingUp, ArrowRight, Crown, CalendarDays, AlertTriangle, Stethoscope, Clock } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function MrDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
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

      {/* Row 1 — Core stats */}
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

      {/* Row 2 — Subscription & monthly stats */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-glow shrink-0">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.activeSubscriptions || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow shrink-0">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.thisMonthPrescriptions || 0}</p>
            </div>
          </div>
        </Card>
        <Link href="/dashboard/mr/subscriptions" className="block">
          <Card className="p-5 premium-card-static hover:ring-2 hover:ring-red-300 dark:hover:ring-red-700 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-glow shrink-0">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Need Subscription</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.noSubscription || 0}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* 7-Day Trend Chart */}
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

      {/* Row 3 — Top Doctors + Expiring Soon */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Top Doctors */}
        <Card className="p-5 premium-card-static">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            <Stethoscope className="h-4 w-4 inline mr-1.5 text-emerald-500" />
            Top Performing Doctors
          </h3>
          {(stats?.topDoctors?.length ?? 0) > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead className="text-right">Prescriptions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats!.topDoctors.map((d: any, idx: number) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-sm font-medium">{d.fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.clinicName || '—'}</TableCell>
                    <TableCell className="text-sm text-right font-semibold">{d.prescriptionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">No doctor data yet</div>
          )}
        </Card>

        {/* Expiring Soon */}
        <Card className="p-5 premium-card-static">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            <Clock className="h-4 w-4 inline mr-1.5 text-amber-500" />
            Expiring Subscriptions
          </h3>
          {(stats?.expiringSoon?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {stats!.expiringSoon.map((s: any) => (
                <div key={s.doctorId} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.doctorName}</p>
                    <p className="text-xs text-muted-foreground">{s.planName}</p>
                  </div>
                  <Badge className={s.daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                    {s.daysLeft <= 1 ? 'Today' : `${s.daysLeft} days`}
                  </Badge>
                </div>
              ))}
              <Link
                href="/dashboard/mr/subscriptions"
                className="block text-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
              >
                View all subscriptions <ArrowRight className="h-3 w-3 inline" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">No subscriptions expiring soon</div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-5 premium-card-static">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          <Activity className="h-4 w-4 inline mr-1.5 text-blue-500" />
          Recent Activity
        </h3>
        {(stats?.recentActivity?.length ?? 0) > 0 ? (
          <div className="space-y-2">
            {stats!.recentActivity.slice(0, 10).map((a: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    <span className="font-medium">{a.patientName}</span> prescribed by <span className="font-medium">{a.doctorName}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">No recent activity</div>
        )}
      </Card>
    </div>
  );
}
