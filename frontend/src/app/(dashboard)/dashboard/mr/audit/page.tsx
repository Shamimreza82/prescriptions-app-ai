'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useAuditOverview,
  useAuditDoctors,
  useAuditMedicines,
  useAuditTrends,
} from '@/features/mr/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SearchCheck, TrendingUp, TrendingDown, Minus, AlertCircle, Package, Stethoscope, CalendarDays, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'doctors', label: 'By Doctor' },
  { id: 'medicines', label: 'By Medicine' },
  { id: 'trends', label: 'Trends' },
];

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

export default function MrAuditPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [doctorPage, setDoctorPage] = useState(1);
  const [medicinePage, setMedicinePage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const { data: overview, isLoading: overviewLoading } = useAuditOverview();
  const { data: doctorsData, isLoading: doctorsLoading } = useAuditDoctors({ page: doctorPage, limit: ITEMS_PER_PAGE });
  const { data: medicinesData, isLoading: medicinesLoading } = useAuditMedicines({ page: medicinePage, limit: ITEMS_PER_PAGE });
  const { data: trends, isLoading: trendsLoading } = useAuditTrends();

  const renderTabBar = () => (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === tab.id
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  if (overviewLoading || doctorsLoading || medicinesLoading || trendsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-10 w-80 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid gap-5 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescription Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your company&apos;s medicine performance across assigned doctors</p>
        </div>
        <Link
          href="/dashboard/mr/audit/tracked-medicines"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <Package className="h-4 w-4" />
          Tracked Medicines
        </Link>
      </div>

      {renderTabBar()}

      {/* ── Overview Tab ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && overview && (
        <>
          <div className="grid gap-5 md:grid-cols-4">
            <Card className="p-5 premium-card-static">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tracked Medicines</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.activeTrackedMedicinesCount || 0}</p>
                  <p className="text-xs text-muted-foreground">of {overview.trackedMedicinesCount} total</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 premium-card-static">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prescribing Doctors</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.doctorsPrescribingTracked || 0}</p>
                  <p className="text-xs text-muted-foreground">doctors prescribe your medicines</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 premium-card-static">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                  <SearchCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tracked Prescriptions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.totalTrackedPrescriptions || 0}</p>
                  <p className="text-xs text-muted-foreground">prescriptions with your medicines</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 premium-card-static">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.thisMonthTracked || 0}</p>
                  <div className="flex items-center gap-1 text-xs">
                    {overview.trendPercent > 0 ? (
                      <ArrowUp className="h-3 w-3 text-emerald-500" />
                    ) : overview.trendPercent < 0 ? (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    ) : null}
                    <span className={overview.trendPercent > 0 ? 'text-emerald-600' : overview.trendPercent < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                      {overview.trendPercent > 0 ? '+' : ''}{overview.trendPercent}% vs last month
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {overview.topTrackedMedicine && (
            <Card className="p-5 premium-card-static">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                <TrendingUp className="h-4 w-4 inline mr-1.5 text-indigo-500" />
                Top Tracked Medicine
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{overview.topTrackedMedicine.name}</p>
                  <p className="text-sm text-muted-foreground">Most prescribed medicine from your tracked list</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{overview.topTrackedMedicine.count}</p>
                  <p className="text-xs text-muted-foreground">total prescriptions</p>
                </div>
              </div>
            </Card>
          )}

          {(!overview.trackedMedicinesCount || overview.trackedMedicinesCount === 0) && (
            <Card className="p-8 premium-card-static">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No medicines tracked yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Search for your company&apos;s medicines and add them to tracking to see prescription audit data.
                </p>
                <Link
                  href="/dashboard/mr/audit/tracked-medicines"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  Manage Tracked Medicines
                </Link>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── By Doctor Tab ───────────────────────────────────────────── */}
      {activeTab === 'doctors' && doctorsData && (
        <Card className="p-5 premium-card-static">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            <Stethoscope className="h-4 w-4 inline mr-1.5 text-emerald-500" />
            Per-Doctor Audit
          </h3>
          {doctorsData.data?.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead className="text-right">Total Rx</TableHead>
                    <TableHead className="text-right">Tracked Rx</TableHead>
                    <TableHead className="text-right">Engagement</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                    <TableHead>Last Rx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorsData.data.map((doc: any) => (
                    <TableRow key={doc.doctorId}>
                      <TableCell className="text-sm font-medium">{doc.doctorName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.clinicName || '—'}</TableCell>
                      <TableCell className="text-sm text-right">{doc.totalPrescriptions}</TableCell>
                      <TableCell className="text-sm text-right font-semibold text-indigo-600 dark:text-indigo-400">
                        {doc.trackedPrescriptions}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={
                          doc.engagementPercent >= 50
                            ? 'bg-emerald-100 text-emerald-700'
                            : doc.engagementPercent >= 25
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }>
                          {doc.engagementPercent}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TrendIcon trend={doc.trend} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {doc.lastPrescriptionDate
                          ? new Date(doc.lastPrescriptionDate).toLocaleDateString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {doctorsData.total > ITEMS_PER_PAGE && (
                <div className="mt-4">
                  <Pagination
                    page={doctorPage}
                    totalPages={Math.ceil(doctorsData.total / ITEMS_PER_PAGE)}
                    onPageChange={setDoctorPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">No doctor data available. Add tracked medicines first.</div>
          )}
        </Card>
      )}

      {/* ── By Medicine Tab ──────────────────────────────────────────── */}
      {activeTab === 'medicines' && medicinesData && (
        <Card className="p-5 premium-card-static">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            <Package className="h-4 w-4 inline mr-1.5 text-blue-500" />
            Medicine Performance
          </h3>
          {medicinesData.data?.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Generic</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead className="text-right">Prescriptions</TableHead>
                    <TableHead className="text-right">Doctors</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicinesData.data.map((med: any) => (
                    <TableRow key={med.name}>
                      <TableCell className="text-sm font-medium">{med.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{med.genericName || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{med.strength || '—'}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">{med.totalPrescriptions}</TableCell>
                      <TableCell className="text-sm text-right">{med.doctorsCount}</TableCell>
                      <TableCell className="text-right">
                        <TrendIcon trend={med.trend} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {medicinesData.total > ITEMS_PER_PAGE && (
                <div className="mt-4">
                  <Pagination
                    page={medicinePage}
                    totalPages={Math.ceil(medicinesData.total / ITEMS_PER_PAGE)}
                    onPageChange={setMedicinePage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">No medicine data available. Add tracked medicines first.</div>
          )}
        </Card>
      )}

      {/* ── Trends Tab ───────────────────────────────────────────────── */}
      {activeTab === 'trends' && trends && (
        <Card className="p-5 premium-card-static">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            <CalendarDays className="h-4 w-4 inline mr-1.5 text-violet-500" />
            Monthly Trend (This Year)
          </h3>
          {trends.some((t: any) => t.count > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', padding: '6px 10px' }}
                    formatter={(value: any) => [value, 'Prescriptions']}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">No trend data available</div>
          )}
        </Card>
      )}
    </div>
  );
}
