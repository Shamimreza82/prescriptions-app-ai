'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminSubscriptions } from '@/features/dashboard/hooks';
import { useCancelSubscription, useUpdateAdminSubscription, usePlans } from '@/features/plans/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FilterSelect } from '@/components/ui/filter-select';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { MoreHorizontal, XCircle, Eye, Pencil, CheckCircle } from 'lucide-react';

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [activateSub, setActivateSub] = useState<any>(null);
  const [activatePlanId, setActivatePlanId] = useState('');
  const [editSub, setEditSub] = useState<any>(null);
  const [editPatientLimit, setEditPatientLimit] = useState(0);
  const [editPrescriptionLimit, setEditPrescriptionLimit] = useState(0);
  const [menuTarget, setMenuTarget] = useState<{ sub: any; top: number; right: number } | null>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: plans } = usePlans();
  const { data, isLoading } = useAdminSubscriptions({ page, limit: 10, search, status: statusFilter || undefined, planId: planFilter || undefined });

  const planOptions = (plans || []).map((p: any) => ({ value: p.id, label: p.name }));
  const cancelSub = useCancelSubscription();
  const updateSub = useUpdateAdminSubscription();
  const cancelTarget = cancelId ? data?.data?.find((s: any) => s.id === cancelId) : null;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuTarget(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage doctor subscription plans</p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} /></div>
        <div className="flex gap-3">
          <FilterSelect value={planFilter} onChange={(v) => { setPlanFilter(v); setPage(1); }} options={planOptions} placeholder="All Plans" />
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statusOptions} placeholder="All Status" />
        </div>
      </div>

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(v) => !v && setCancelId(null)}
        title="Cancel Subscription"
        message={`Are you sure you want to cancel the ${cancelTarget?.plan?.name || 'current'} plan for ${cancelTarget?.doctor?.fullName}?`}
        confirmLabel="Cancel Subscription"
        variant="destructive"
        loading={cancelSub.isPending}
        onConfirm={() => cancelId && cancelSub.mutate(cancelId, { onSuccess: () => setCancelId(null) })}
      />

      {/* Activate Subscription Dialog */}
      <Dialog open={!!activateSub} onOpenChange={(v) => { if (!v) { setActivateSub(null); setActivatePlanId(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Activate Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Assign a new plan for <strong>{activateSub?.doctor?.fullName}</strong>
            </p>
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <select
                value={activatePlanId}
                onChange={(e) => setActivatePlanId(e.target.value)}
                className="premium-input w-full h-11 px-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm"
              >
                <option value="">Choose a plan...</option>
                {plans?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ৳{p.price} ({p.duration} days, {p.patientLimit} patients)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setActivateSub(null); setActivatePlanId(''); }} className="flex-1">
                Cancel
              </Button>
              <Button
                className="gradient-primary text-white flex-1"
                disabled={!activatePlanId || updateSub.isPending}
                onClick={() => {
                  updateSub.mutate(
                    { id: activateSub.id, data: { status: 'ACTIVE', plan: activatePlanId } },
                    { onSuccess: () => { setActivateSub(null); setActivatePlanId(''); } }
                  );
                }}
              >
                {updateSub.isPending ? 'Activating...' : 'Activate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={(v) => !v && setSelectedSub(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Doctor</p><p className="font-medium">{selectedSub.doctor?.fullName}</p></div>
                <div><p className="text-xs text-muted-foreground">Clinic</p><p className="font-medium">{selectedSub.doctor?.clinicName}</p></div>
                <div><p className="text-xs text-muted-foreground">Plan</p><p className="font-medium">{selectedSub.plan?.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Value</p><p className="font-medium font-mono">{selectedSub.plan?.price != null ? `${Number(selectedSub.plan.price).toLocaleString()} BDT` : '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={selectedSub.status === 'ACTIVE' ? 'success' : selectedSub.status === 'EXPIRED' ? 'destructive' : 'warning'}>{selectedSub.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Patient Offer</p><p className="font-medium">{selectedSub.patientLimit}</p></div>
                <div><p className="text-xs text-muted-foreground">Rx Offer</p><p className="font-medium">{selectedSub.prescriptionLimit}</p></div>
                <div><p className="text-xs text-muted-foreground">Start Date</p><p className="font-medium">{new Date(selectedSub.startDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground">End Date</p><p className="font-medium">{selectedSub.endDate ? new Date(selectedSub.endDate).toLocaleDateString() : '—'}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Limits Dialog */}
      <Dialog open={!!editSub} onOpenChange={(v) => !v && setEditSub(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Limits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient Limit</Label>
              <Input
                type="number"
                min={0}
                value={editPatientLimit}
                onChange={(e) => setEditPatientLimit(Number(e.target.value))}
                className="h-11 premium-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Prescription Limit</Label>
              <Input
                type="number"
                min={0}
                value={editPrescriptionLimit}
                onChange={(e) => setEditPrescriptionLimit(Number(e.target.value))}
                className="h-11 premium-input"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only this subscription's limits will change. The original plan is not affected.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditSub(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                className="gradient-primary text-white flex-1"
                disabled={updateSub.isPending}
                onClick={() => {
                  updateSub.mutate(
                    { id: editSub.id, data: { patientLimit: editPatientLimit, prescriptionLimit: editPrescriptionLimit } },
                    { onSuccess: () => setEditSub(null) }
                  );
                }}
              >
                {updateSub.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <>
          <div className="premium-card-static overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Patient Offer</TableHead>
                  <TableHead>Rx Offer</TableHead>
                  <TableHead>Patients Left</TableHead>
                  <TableHead>Rx Left</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length === 0 ? (
                  <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No subscriptions found</TableCell></TableRow>
                ) : (
                  data?.data?.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.doctor?.fullName}</TableCell>
                      <TableCell>{sub.doctor?.clinicName}</TableCell>
                      <TableCell><Badge variant={sub.plan?.name === 'Premium' ? 'success' : 'secondary'}>{sub.plan?.name || sub.planId}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">
                        {sub.plan?.price != null
                          ? `${Number(sub.plan.price).toLocaleString()} BDT`
                          : sub.payments?.[0]?.amount
                            ? `${Number(sub.payments[0].amount).toLocaleString()} BDT`
                            : '—'}
                      </TableCell>
                      <TableCell><Badge variant={sub.status === 'ACTIVE' ? 'success' : sub.status === 'EXPIRED' ? 'destructive' : 'warning'}>{sub.status}</Badge></TableCell>
                      <TableCell>{sub.patientLimit}</TableCell>
                      <TableCell>{sub.prescriptionLimit}</TableCell>
                      <TableCell>
                        {sub.status === 'ACTIVE'
                          ? Math.max(0, sub.patientLimit - (sub.doctor?._count?.patients || 0))
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {sub.status === 'ACTIVE'
                          ? Math.max(0, sub.prescriptionLimit - (sub.doctor?._count?.prescriptions || 0))
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {sub.endDate && sub.status === 'ACTIVE'
                          ? (() => {
                              const days = Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                              return days > 0 ? days : 0;
                            })()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            const rect = (e.target as HTMLElement).closest('button')!.getBoundingClientRect();
                            setMenuTarget(menuTarget?.sub.id === sub.id ? null : { sub, top: rect.bottom + 4, right: window.innerWidth - rect.right });
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
        </>
      )}

      {/* Actions Menu */}
      {menuTarget && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-48 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong py-1.5 animate-scale-in"
          style={{ top: menuTarget.top, right: menuTarget.right }}
        >
          <button
            onClick={() => { setSelectedSub(menuTarget.sub); setMenuTarget(null); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Eye className="h-4 w-4 text-blue-500" /> View Details
          </button>
          <button
            onClick={() => { setEditSub(menuTarget.sub); setEditPatientLimit(menuTarget.sub.patientLimit); setEditPrescriptionLimit(menuTarget.sub.prescriptionLimit); setMenuTarget(null); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Pencil className="h-4 w-4 text-purple-500" /> Edit Limits
          </button>
          {menuTarget.sub.status === 'ACTIVE' && (
            <button
              onClick={() => { setCancelId(menuTarget.sub.id); setMenuTarget(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <XCircle className="h-4 w-4" /> Cancel Subscription
            </button>
          )}
          {menuTarget.sub.status !== 'ACTIVE' && (
            <button
              onClick={() => { setActivateSub(menuTarget.sub); setMenuTarget(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
            >
              <CheckCircle className="h-4 w-4" /> Activate Subscription
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}