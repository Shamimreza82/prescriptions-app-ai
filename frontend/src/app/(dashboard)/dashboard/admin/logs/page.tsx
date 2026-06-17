'use client';

import { useState, useCallback } from 'react';
import { useAdminLogs, useDeleteAdminLogs } from '@/features/dashboard/hooks';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trash2, RotateCcw, Calendar } from 'lucide-react';

const actionColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  LOGIN: 'default',
  LOGOUT: 'secondary',
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
};

const presets = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, isLoading } = useAdminLogs({
    page, limit: 20, search,
    dateFrom: startDate || undefined,
    dateTo: endDate || undefined,
  });
  const deleteMutation = useDeleteAdminLogs();

  const handleDelete = () => {
    if (!startDate || !endDate) return;
    deleteMutation.mutate(
      { startDate, endDate },
      { onSuccess: () => { setConfirmOpen(false); setStartDate(''); setEndDate(''); setPage(1); } }
    );
  };

  const applyPreset = useCallback((days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setStartDate(formatDate(from));
    setEndDate(formatDate(to));
    setPage(1);
  }, []);

  const clearDates = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  }, []);

  const hasDateFilter = !!startDate && !!endDate;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Track system activity</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>

        <div className="flex items-center gap-1.5">
          {presets.map((p) => (
            <Button
              key={p.days}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(p.days)}
              className="h-9 text-xs"
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="premium-input h-9 px-3 text-sm w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="premium-input h-9 px-3 text-sm w-36"
            />
          </div>

          {hasDateFilter && (
            <Button variant="ghost" size="icon" onClick={clearDates} className="mt-5 h-9 w-9" title="Clear date filter">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            disabled={!hasDateFilter}
            onClick={() => setConfirmOpen(true)}
            className="mt-5"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {hasDateFilter && data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Showing <strong>{data.data?.length || 0}</strong> of <strong>{data.total}</strong> logs
            from {startDate} to {endDate}
          </span>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Logs"
        message={`Are you sure you want to delete all ${data?.total || 0} logs from ${startDate} to ${endDate}? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
      ) : !data?.data?.length ? (
        <div className="premium-card-static p-8 text-center text-muted-foreground">No logs found</div>
      ) : (
        <div className="premium-card-static overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.data.map((log: any) => (
              <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-blue-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{log.user?.email || 'Unknown'}</span>
                    <Badge variant={actionColors[log.action] || 'default'} className="text-[10px] px-1.5 py-0">{log.action}</Badge>
                    <span className="text-sm text-muted-foreground">{log.entity}</span>
                    {log.entityId && <span className="text-xs text-muted-foreground font-mono">#{log.entityId.slice(0, 8)}</span>}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{JSON.stringify(log.details)}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
            <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}