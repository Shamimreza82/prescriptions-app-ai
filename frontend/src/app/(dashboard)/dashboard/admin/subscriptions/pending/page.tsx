'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePendingSubscriptions, useConfirmSubscription, useRejectSubscription } from '@/features/plans/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { Loader2, CheckCircle2, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

function Dropdown({ onConfirm, onReject, disabled }: { onConfirm: () => void; onReject: () => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
        zIndex: 9999,
      });
    }
  }, [open]);

  return (
    <>
      <Button ref={buttonRef} size="sm" onClick={() => setOpen(!open)} disabled={disabled} className="gap-1">
        Actions <ChevronDown className="h-3 w-3" />
      </Button>
      {open && createPortal(
        <div ref={menuRef} className="w-44 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg py-1 overflow-hidden" style={menuStyle}>
          <button
            onClick={() => { setOpen(false); onConfirm(); }}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-green-600 dark:text-green-400"
          >
            <CheckCircle className="h-4 w-4" /> Confirm
          </button>
          <button
            onClick={() => { setOpen(false); onReject(); }}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-red-600 dark:text-red-400"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

export default function PendingSubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: 'confirm' | 'reject'; doctorName: string; planName: string } | null>(null);
  const { data, isLoading } = usePendingSubscriptions({ page, limit: 10, search });
  const confirmSub = useConfirmSubscription();
  const rejectSub = useRejectSubscription();
  const subscriptions = data?.data;
  const total = data?.total;

  const handleAction = () => {
    if (!confirmDialog) return;
    const mutate = confirmDialog.action === 'confirm' ? confirmSub : rejectSub;
    mutate.mutate(confirmDialog.id, { onSuccess: () => setConfirmDialog(null) });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Verify transaction IDs and confirm subscriptions</p>
      </div>

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />

      <ConfirmDialog
        open={!!confirmDialog}
        onOpenChange={(v) => !v && setConfirmDialog(null)}
        title={confirmDialog?.action === 'confirm' ? 'Confirm Subscription' : 'Reject Subscription'}
        message={
          confirmDialog?.action === 'confirm'
            ? `Are you sure you want to activate the ${confirmDialog?.planName} plan for ${confirmDialog?.doctorName}?`
            : `Are you sure you want to reject the ${confirmDialog?.planName} plan request from ${confirmDialog?.doctorName}?`
        }
        confirmLabel={confirmDialog?.action === 'confirm' ? 'Confirm' : 'Reject'}
        variant={confirmDialog?.action === 'confirm' ? 'default' : 'destructive'}
        loading={confirmSub.isPending || rejectSub.isPending}
        onConfirm={handleAction}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
      ) : !subscriptions?.length ? (
        <div className="premium-card-static p-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All Clear</h3>
          <p className="text-sm text-muted-foreground">{search ? 'No results match your search.' : 'No pending subscriptions to review.'}</p>
        </div>
      ) : (
        <div className="premium-card-static">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub: any) => {
                const payment = sub.payments?.[0];
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.doctor?.fullName}</TableCell>
                    <TableCell>{sub.doctor?.clinicName}</TableCell>
                    <TableCell><Badge variant="secondary">{sub.plan?.name}</Badge></TableCell>
                    <TableCell>{payment?.amount || sub.plan?.price}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {payment?.transactionId || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate" title={payment?.notes || ''}>
                      {payment?.notes || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dropdown
                        onConfirm={() => setConfirmDialog({ id: sub.id, action: 'confirm', doctorName: sub.doctor?.fullName, planName: sub.plan?.name })}
                        onReject={() => setConfirmDialog({ id: sub.id, action: 'reject', doctorName: sub.doctor?.fullName, planName: sub.plan?.name })}
                        disabled={confirmSub.isPending || rejectSub.isPending}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
            <Pagination page={page} totalPages={data?.totalPages || 1} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
