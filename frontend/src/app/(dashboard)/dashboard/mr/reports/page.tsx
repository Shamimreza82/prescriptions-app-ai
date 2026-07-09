'use client';

import { useState } from 'react';
import { useReportsOverview, useReportsPrescriptions, useReportsMedicines, useReportsRevenue, useMyDoctors } from '@/features/mr/hooks';
import { ChartContainer, ChartSkeleton } from '@/components/chart';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { SearchBar } from '@/components/admin/DataTable';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import Link from 'next/link';
import { FileText, Activity, UserRound, Pill, DollarSign, TrendingUp, CalendarDays, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { ReportsOverview, ReportsMedicines, ReportsRevenue, ReportPayment } from '@/features/mr/types';

type Tab = 'overview' | 'prescriptions' | 'medicines' | 'revenue';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: TrendingUp },
  { key: 'prescriptions', label: 'Prescriptions', icon: FileText },
  { key: 'medicines', label: 'Medicines', icon: Pill },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
];

export default function MrReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [rxPage, setRxPage] = useState(1);
  const [rxSearch, setRxSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [medPage, setMedPage] = useState(1);
  const [medLimit, setMedLimit] = useState(8);
  const [payPage, setPayPage] = useState(1);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined);
  const [showDrDropdown, setShowDrDropdown] = useState(false);

  const handleRxSearch = (v: string) => {
    setRxSearch(v);
    setRxPage(1);
  };

  const { data: overview, isLoading: loadingOverview } = useReportsOverview();
  const { data: rxData, isLoading: loadingRx } = useReportsPrescriptions({
    page: rxPage, search: rxSearch || undefined,
    dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
  });
  const { data: doctorSearchResults } = useMyDoctors(
    doctorSearch ? { search: doctorSearch, limit: 10 } : undefined,
  );
  const { data: medicines, isLoading: loadingMedicines } = useReportsMedicines({ page: medPage, limit: medLimit, doctorId: selectedDoctorId });
  const { data: revenue, isLoading: loadingRevenue } = useReportsRevenue({ page: payPage, limit: 10 });

  const renderTabNav = () => (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Insights across your assigned doctors</p>
        </div>
      </div>

      {renderTabNav()}

      {activeTab === 'overview' && renderOverview(overview, loadingOverview)}
      {activeTab === 'prescriptions' && renderPrescriptions(rxData, loadingRx, rxPage, setRxPage, rxSearch, handleRxSearch, dateFrom, setDateFrom, dateTo, setDateTo)}
      {activeTab === 'medicines' && renderMedicines(medicines, loadingMedicines, medPage, setMedPage, medLimit, setMedLimit, selectedDoctorId, setSelectedDoctorId, doctorSearch, setDoctorSearch, showDrDropdown, setShowDrDropdown, doctorSearchResults)}
      {activeTab === 'revenue' && renderRevenue(revenue, loadingRevenue, payPage, setPayPage)}
    </div>
  );
}

function renderOverview(data: ReportsOverview | undefined, loading: boolean) {
  if (loading) return <ChartSkeleton />;

  const chartData = data?.monthlyLabels.map((label, i) => ({
    month: label,
    prescriptions: data.monthlyPrescriptions[i] || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
              <UserRound className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned Doctors</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.totalDoctors || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Prescriptions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.totalPrescriptions || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.thisMonthPrescriptions || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.todaysPrescriptions || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <ChartContainer title="Monthly Prescription Trend" description="Prescriptions per month across all assigned doctors (current year)">
        {chartData.length > 0 ? (
          <div className="h-60 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value: any) => [value, 'Prescriptions']}
                />
                <Bar dataKey="prescriptions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No prescription data available</div>
        )}
      </ChartContainer>
    </div>
  );
}

function renderPrescriptions(
  data: any, loading: boolean,
  page: number, setPage: (p: number) => void,
  search: string, onSearch: (s: string) => void,
  dateFrom: string, setDateFrom: (s: string) => void,
  dateTo: string, setDateTo: (s: string) => void,
) {
  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <Card className="p-5 premium-card-static">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex-1 w-full sm:max-w-sm">
          <SearchBar value={search} onChange={onSearch} />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm w-full sm:w-auto"
          />
          <span className="text-xs text-muted-foreground self-center">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm w-full sm:w-auto"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No prescriptions found</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell">Rx No</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead className="hidden lg:table-cell">Medicines</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((rx: any) => (
                <TableRow key={rx.id}>
                  <TableCell className="font-mono text-xs hidden lg:table-cell">{rx.prescriptionNo}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{rx.patient?.fullName}</div>
                    <div className="text-xs text-muted-foreground">{rx.patient?.patientId}</div>
                  </TableCell>
                  <TableCell className="text-sm">{rx.doctor?.fullName}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {rx.medicines?.slice(0, 3).map((m: any) => (
                        <Badge key={m.name} variant="outline" className="text-xs">{m.name}</Badge>
                      ))}
                      {rx._count?.medicines > 3 && (
                        <Badge variant="outline" className="text-xs">+{rx._count.medicines - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {new Date(rx.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/mr/doctors/${rx.doctorId}/prescriptions/${rx.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
    </Card>
  );
}

function renderMedicines(
  data: ReportsMedicines | undefined, loading: boolean,
  page: number, setPage: (p: number) => void, limit: number, setLimit: (n: number) => void,
  selectedDoctorId: string | undefined, setSelectedDoctorId: (id: string | undefined) => void,
  doctorSearch: string, setDoctorSearch: (s: string) => void,
  showDrDropdown: boolean, setShowDrDropdown: (v: boolean) => void,
  doctorSearchResults: any,
) {
  if (loading) return <ChartSkeleton />;

  const meds = data?.medicines ?? [];
  const total = data?.totalPrescriptions ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const chartData = meds.map((m) => ({
    name: m.name.length > 20 ? m.name.substring(0, 20) + '...' : m.name,
    count: m._count._all,
    fullName: `${m.name}${m.strength ? ' ' + m.strength : ''}${m.form ? ' (' + m.form + ')' : ''}`,
  }));

  return (
    <div className="space-y-6">
      {/* Doctor filter */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 max-w-sm relative w-full sm:w-auto">
            <SearchBar
              value={doctorSearch}
              onChange={(v) => { setDoctorSearch(v); setShowDrDropdown(true); }}
            />
            {showDrDropdown && doctorSearch && doctorSearchResults?.data?.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {doctorSearchResults.data.map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDoctorId(d.id);
                      setDoctorSearch(d.fullName);
                      setShowDrDropdown(false);
                      setPage(1);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {d.fullName}
                  </button>
                ))}
              </div>
            )}
            {showDrDropdown && doctorSearch && doctorSearchResults?.data?.length === 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm text-muted-foreground text-center">
                No doctors found
              </div>
            )}
          </div>
          {selectedDoctorId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedDoctorId(undefined); setDoctorSearch(''); setPage(1); }}
              className="shrink-0 text-xs self-start sm:self-center"
            >
              All Doctors
            </Button>
          )}
        </div>
      </div>

      <ChartContainer title={`Top ${limit} Prescribed Medicines`} description={`Top ${limit} medicines ${selectedDoctorId ? 'for selected doctor' : 'across all assigned doctors'}`}>
        <div className="mb-4">
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-[110px]"><SelectValue placeholder="Limit" /></SelectTrigger>
            <SelectContent>
              {[8, 10, 20, 50, 100].map(n => (
                <SelectItem key={n} value={String(n)}>Top {n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {chartData.length > 0 ? (
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={55} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value: any, _name: any, props: any) => [value, props.payload.fullName]}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No medicine data available</div>
        )}
      </ChartContainer>

      <Card className="p-5 premium-card-static">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Medicine Ranking</h3>
        {meds.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No data</div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">#</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead className="hidden md:table-cell">Strength</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Times Prescribed</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meds.map((m, idx) => {
                const catLabels: Record<string, string> = { 'TAB.': 'Tablet', 'CAP.': 'Capsule', 'INJ.': 'Injection', 'SYR.': 'Syrup', 'DROP': 'Drop', 'CRM.': 'Cream', 'OIN.': 'Ointment', 'SUS.': 'Suspension', 'SPRAY': 'Spray', 'INH.': 'Inhaler' };
                return (
                  <TableRow key={`${m.name}-${m.strength}-${m.form}`}>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{idx + 1}</TableCell>
                    <TableCell className="text-sm font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{m.strength || '—'}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{m.form ? (catLabels[m.form] || m.form) : '—'}</TableCell>
                    <TableCell className="text-sm">{m._count._all}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(2, (m._count._all / total) * 100)}%` }} />
                        <span className="text-xs text-muted-foreground">{((m._count._all / total) * 100).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} total={data?.total} onPageChange={setPage} />
            </div>
          </>
          )}
        </Card>
      </div>
    );
}

function renderRevenue(data: ReportsRevenue | undefined, loading: boolean, page: number, setPage: (p: number) => void) {
  if (loading) return <ChartSkeleton />;

  const chartData = data?.monthlyLabels.map((label, i) => ({
    month: label,
    revenue: data.monthlyRevenue[i] || 0,
  })) || [];
  const payments = data?.payments ?? [];
  const paymentsTotal = data?.paymentsTotal ?? 0;
  const paymentsTotalPages = data?.paymentsTotalPages ?? 1;
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue (YTD)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">BDT {totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Payments</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 premium-card-static">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Month</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">BDT {chartData[new Date().getMonth()]?.revenue.toLocaleString() || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <ChartContainer title="Monthly Revenue" description="Subscription revenue per month (current year)">
        {chartData.some(d => d.revenue > 0) ? (
          <div className="h-60 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value: any) => [`BDT ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No revenue data yet</div>
        )}
      </ChartContainer>

      <Card className="p-5 premium-card-static">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Payments</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No payments recorded</div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell">Transaction ID</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p: ReportPayment) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs hidden lg:table-cell">{p.transactionId}</TableCell>
                  <TableCell className="text-sm">{p.subscription?.doctor?.fullName}</TableCell>
                  <TableCell className="text-sm">{p.subscription?.plan?.name}</TableCell>
                  <TableCell className="text-sm font-medium">BDT {p.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Pagination page={page} totalPages={paymentsTotalPages} total={paymentsTotal} onPageChange={setPage} />
          </div>
          </>
        )}
      </Card>
    </div>
  );
}
