'use client';

import { useState, useCallback } from 'react';
import { useAdminLogs, useDeleteAdminLogs, useDeleteAdminLog, useDeleteAdminLogsBulk } from '@/features/dashboard/hooks';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Trash2, RotateCcw, Calendar, CheckSquare, Square } from 'lucide-react';

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
  const [confirmSingle, setConfirmSingle] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useAdminLogs({
    page, limit: 20, search,
    dateFrom: startDate || undefined,
    dateTo: endDate || undefined,
  });
  const deleteMutation = useDeleteAdminLogs();
  const deleteSingleMutation = useDeleteAdminLog();
  const deleteBulkMutation = useDeleteAdminLogsBulk();

  const handleDelete = () => {
    if (!startDate || !endDate) return;
    deleteMutation.mutate(
      { startDate, endDate },
      { onSuccess: () => { setConfirmOpen(false); setStartDate(''); setEndDate(''); setPage(1); setSelectedIds(new Set()); } }
    );
  };

  const handleDeleteSingle = (id: string) => {
    deleteSingleMutation.mutate(id, {
      onSuccess: () => { setConfirmSingle(null); setSelectedIds(new Set()); },
    });
  };

  const handleDeleteBulk = () => {
    const ids = Array.from(selectedIds);
    deleteBulkMutation.mutate(ids, {
      onSuccess: () => { setConfirmBulk(false); setSelectedIds(new Set()); },
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data?.data?.length) return;
    if (selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.data.map((l: any) => l.id)));
    }
  };

  const applyPreset = useCallback((days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setStartDate(formatDate(from));
    setEndDate(formatDate(to));
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const clearDates = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const hasDateFilter = !!startDate && !!endDate;
  const allSelected = data?.data?.length > 0 && selectedIds.size === data.data.length;

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
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); setSelectedIds(new Set()); }} />
        </div>

        <div className="w-28">
          <Select
            value=""
            onValueChange={(v) => applyPreset(Number(v))}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Quick range" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.days} value={String(p.days)}>
                  Last {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); setSelectedIds(new Set()); }}
              className="premium-input h-9 px-3 text-sm w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); setSelectedIds(new Set()); }}
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

      {/* Bulk Delete Confirm */}
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

      {/* Single Delete Confirm */}
      <ConfirmDialog
        open={!!confirmSingle}
        onOpenChange={(v) => !v && setConfirmSingle(null)}
        title="Delete Log"
        message="Are you sure you want to delete this log entry? This action cannot be undone."
        confirmLabel={deleteSingleMutation.isPending ? 'Deleting...' : 'Delete'}
        variant="destructive"
        loading={deleteSingleMutation.isPending}
        onConfirm={() => confirmSingle && handleDeleteSingle(confirmSingle)}
      />

      {/* Bulk Selected Delete Confirm */}
      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        title="Delete Selected Logs"
        message={`Are you sure you want to delete ${selectedIds.size} selected log(s)? This action cannot be undone.`}
        confirmLabel={deleteBulkMutation.isPending ? 'Deleting...' : 'Delete'}
        variant="destructive"
        loading={deleteBulkMutation.isPending}
        onConfirm={handleDeleteBulk}
      />

      {/* Floating Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 rounded-xl bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 px-5 py-3 shadow-strong flex items-center justify-between animate-slide-down">
          <span className="text-sm font-semibold flex items-center gap-2">
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-white/20 dark:bg-gray-900/20 text-xs font-bold">
              {selectedIds.size}
            </span>
            log{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-white/80 dark:text-gray-900/80 hover:text-white dark:hover:text-gray-900"
            >
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmBulk(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
      ) : !data?.data?.length ? (
        <div className="premium-card-static p-8 text-center text-muted-foreground">No logs found</div>
      ) : (
        <div className="premium-card-static overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.data.map((log: any) => {
              const isSelected = selectedIds.has(log.id);
              return (
                <div
                  key={log.id}
                  className={`group flex items-start gap-3 p-4 transition-colors ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/20'
                      : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <button
                    onClick={() => toggleSelect(log.id)}
                    className="mt-1 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title={isSelected ? 'Deselect' : 'Select'}
                  >
                    {isSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                  </button>
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => setConfirmSingle(log.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete this log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
            >
              {allSelected ? <CheckSquare className="h-3.5 w-3.5 text-blue-600" /> : <Square className="h-3.5 w-3.5" />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total} onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }} />
          </div>
        </div>
      )}
    </div>
  );
}