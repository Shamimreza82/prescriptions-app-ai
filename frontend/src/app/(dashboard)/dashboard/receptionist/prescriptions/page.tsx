'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRecPrescriptions } from '@/features/receptionist/hooks';
import { downloadPrescriptionPDF } from '@/features/receptionist/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { FileText, User, Download, Eye, Calendar, MoreHorizontal, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function RecPrescriptionsPage() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [menuTarget, setMenuTarget] = useState<{ id: string; top: number; right: number } | null>(null);
  const params: any = { page, limit: '20', search };
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  const hasFilters = !!(search || dateFrom || dateTo);
  const { data, isLoading } = useRecPrescriptions(params);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">View prescription records</p>
      </div>

      {/* Search & Date Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Rx No, patient name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          title="From date"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          title="To date"
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            className="rounded-xl text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="premium-card-static">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx No</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Medicines</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {hasFilters ? 'No prescriptions match your filters' : 'No prescriptions found'}
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((rx: any) => (
                  <TableRow key={rx.id}>
                    <TableCell className="font-mono text-xs font-medium">{rx.prescriptionNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{rx.patient?.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{rx.diagnosis || '\u2014'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rx.medicines?.slice(0, 2).map((m: any) => (
                          <Badge key={m.id} variant="outline" className="text-xs">{m.name}</Badge>
                        ))}
                        {rx.medicines?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{rx.medicines.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(rx.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          const rect = (e.target as HTMLElement).closest('button')!.getBoundingClientRect();
                          setMenuTarget(menuTarget?.id === rx.id ? null : { id: rx.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
            <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Actions Menu */}
      {menuTarget && data?.data && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuTarget(null)} />
          <div
            className="fixed z-50 w-48 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong py-1.5 animate-scale-in"
            style={{ top: menuTarget.top, right: menuTarget.right }}
          >
            {(() => {
              const rx = data.data.find((r: any) => r.id === menuTarget.id);
              if (!rx) return null;
              return (
                <>
                  <Link href={`/dashboard/receptionist/prescriptions/${rx.id}`} onClick={() => setMenuTarget(null)}>
                    <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <Eye className="h-4 w-4 text-blue-500" /> View Details
                    </button>
                  </Link>
                  <button
                    onClick={() => { downloadPrescriptionPDF(rx.id); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <Download className="h-4 w-4 text-emerald-500" /> Download PDF
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
