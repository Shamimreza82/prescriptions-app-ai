'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMrSubscriptions, useSubscribeDoctor } from '@/features/mr/hooks';
import { usePlans } from '@/features/plans/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { Check, Crown, CreditCard, Loader2, Clock, XCircle, Stethoscope, AlertCircle, ArrowLeft, MoreHorizontal, Eye, Printer } from 'lucide-react';
import type { MrSubscription, Plan } from '@/features/mr/types';
import Link from 'next/link';

export default function MrSubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [menuTarget, setMenuTarget] = useState<{ item: any; top: number; right: number } | null>(null);
  const [detailSub, setDetailSub] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useMrSubscriptions({ page, search: search || undefined });
  const { data: plans, isLoading: loadingPlans } = usePlans();
  const subscribeDoctor = useSubscribeDoctor();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const subscriptions: MrSubscription[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const mrInfo = data?.mr;
  const platform = data?.platform;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuTarget(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const openSubscribe = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setSelectedPlan(null);
    setTransactionId('');
    setPaymentNotes('');
  };

  const handlePlanSelect = (plan: Plan) => {
    if (!selectedDoctorId) return;
    if (plan.price > 0) {
      setSelectedPlan(plan);
      setTransactionId('');
      setPaymentNotes('');
    } else {
      subscribeDoctor.mutate({ doctorId: selectedDoctorId, data: { planId: plan.id } }, {
        onSuccess: () => { setSelectedDoctorId(null); setSelectedPlan(null); },
      });
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedDoctorId || !selectedPlan) return;
    subscribeDoctor.mutate(
      { doctorId: selectedDoctorId, data: { planId: selectedPlan.id, transactionId: transactionId.trim(), notes: paymentNotes.trim() || undefined } },
      { onSuccess: () => { setSelectedDoctorId(null); setSelectedPlan(null); setTransactionId(''); setPaymentNotes(''); } },
    );
  };

  const closeDialog = () => {
    setSelectedDoctorId(null);
    setSelectedPlan(null);
    setTransactionId('');
    setPaymentNotes('');
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success" className="flex items-center gap-1"><Check className="h-3 w-3" />Active</Badge>;
      case 'PENDING': return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'EXPIRED': return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Expired</Badge>;
      case 'CANCELLED': return <Badge variant="outline" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
      default: return <Badge variant="outline" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mr" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage subscriptions for your assigned doctors</p>
        </div>
      </div>

      <SearchBar value={search} onChange={handleSearch} />

      {/* Subscribe Dialog — Plan Selection */}
      <Dialog open={!!selectedDoctorId && !selectedPlan} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {!(plans ?? []).length ? (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">No plans available.</p>
            ) : (
              (plans ?? []).map((plan: Plan) => (
              <Card key={plan.id} className={`p-5 cursor-pointer border-2 transition-all hover:border-teal-400 ${selectedPlan?.id === plan.id ? 'border-teal-500 shadow-glow' : 'border-gray-100 dark:border-gray-800/50'}`} onClick={() => handlePlanSelect(plan)}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  {plan.price === 0 && <Badge variant="success">Free</Badge>}
                </div>
                {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground"> / {plan.duration} days</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-teal-500 shrink-0" /><span>{plan.patientLimit} patients</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-teal-500 shrink-0" /><span>{plan.prescriptionLimit} prescriptions</span></div>
                </div>
              </Card>
            ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedPlan?.name} Plan</p>
                <p className="text-xs text-muted-foreground">{selectedPlan?.price} for {selectedPlan?.duration} days</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Transaction ID</label>
              <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="premium-input w-full h-11 px-4" placeholder="Enter transaction or payment ID" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
              <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} className="premium-input w-full px-4 py-2.5 resize-none" rows={3} placeholder="Additional notes for admin verification" />
            </div>
            <Button className="w-full" disabled={!transactionId.trim() || subscribeDoctor.isPending} onClick={handleConfirmPayment}>
              {subscribeDoctor.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailSub} onOpenChange={(v) => !v && setDetailSub(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {detailSub && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Doctor</p><p className="font-medium">{detailSub.doctor?.fullName}</p></div>
                <div><p className="text-xs text-muted-foreground">Clinic</p><p className="font-medium">{detailSub.doctor?.clinicName || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Plan</p><p className="font-medium">{detailSub.subscription?.plan?.name || 'None'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>{detailSub.subscription ? statusBadge(detailSub.subscription.status) : <Badge variant="outline">None</Badge>}</div>
                {detailSub.subscription && (
                  <>
                    <div><p className="text-xs text-muted-foreground">Patient Limit</p><p className="font-medium">{detailSub.subscription.patientLimit}</p></div>
                    <div><p className="text-xs text-muted-foreground">Rx Limit</p><p className="font-medium">{detailSub.subscription.prescriptionLimit}</p></div>
                    <div><p className="text-xs text-muted-foreground">Start Date</p><p className="font-medium">{new Date(detailSub.subscription.startDate).toLocaleDateString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">End Date</p><p className="font-medium">{detailSub.subscription.endDate ? new Date(detailSub.subscription.endDate).toLocaleDateString() : '—'}</p></div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading || loadingPlans ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !subscriptions.length ? (
        <div className="premium-card-static p-12 text-center">
          <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Doctors Assigned</h3>
          <p className="text-sm text-muted-foreground">
            {search ? 'No doctors match your search.' : 'You don\'t have any doctors assigned yet.'}
          </p>
        </div>
      ) : (
        <div className="premium-card-static overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Current Plan</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((item) => {
                const hasActiveSub = item.subscription?.status === 'ACTIVE';
                const hasPendingSub = item.subscription?.status === 'PENDING';
                return (
                  <TableRow key={item.doctor.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.doctor.fullName}</TableCell>
                    <TableCell>{item.doctor.clinicName || '—'}</TableCell>
                    <TableCell>
                      {item.subscription ? (
                        <div className="flex items-center gap-1.5">
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                          <span>{item.subscription.plan.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.subscription?.plan?.price != null
                        ? `${Number(item.subscription.plan.price).toLocaleString()} BDT`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.subscription?.startDate
                        ? new Date(item.subscription.startDate).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {item.subscription ? statusBadge(item.subscription.status) : <Badge variant="outline">None</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.subscription
                        ? `${item.subscription.patientLimit} pts / ${item.subscription.prescriptionLimit} Rx`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.subscription?.endDate
                        ? new Date(item.subscription.endDate).toLocaleDateString()
                        : item.subscription?.startDate
                        ? new Date(item.subscription.startDate).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          const rect = (e.target as HTMLElement).closest('button')!.getBoundingClientRect();
                          setMenuTarget(menuTarget?.item.doctor.id === item.doctor.id ? null : { item, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Actions Menu */}
      {menuTarget && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-48 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong py-1.5 animate-scale-in"
          style={{ top: menuTarget.top, right: menuTarget.right }}
        >
          <button
            onClick={() => { setDetailSub(menuTarget.item); setMenuTarget(null); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Eye className="h-4 w-4 text-blue-500" /> View Details
          </button>
          <button
            onClick={() => { openSubscribe(menuTarget.item.doctor.id); setMenuTarget(null); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Crown className="h-4 w-4 text-amber-500" /> {menuTarget.item.subscription ? 'Change Plan' : 'Subscribe'}
          </button>
          {menuTarget.item.subscription?.status === 'ACTIVE' && (
            <button
              onClick={() => {
                const item = menuTarget.item;
                setMenuTarget(null);
                const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
                const w = window.open('', '_blank');
                if (!w) return;
                w.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head><title>Voucher</title>
                  <style>
                    @page { size: A4; margin: 12mm 15mm; }
                    body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 12mm 15mm; box-sizing: border-box; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
                    th, td { padding: 8px 12px; text-align: left; border: 1px solid #ccc; }
                    th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
                    td:first-child { color: #666; width: 120px; }
                    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .header p { margin: 4px 0 0; font-size: 12px; color: #666; }
                    .title { text-align: center; margin-bottom: 24px; }
                    .title h2 { margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.2em; }
                    .title p { margin: 2px 0 0; font-size: 11px; color: #999; }
                    .footer { border-top: 2px solid #111; padding-top: 16px; margin-top: 24px; display: flex; justify-content: space-between; align-items: end; font-size: 11px; }
                    .sig { width: 160px; border-bottom: 1px solid #999; margin-top: 4px; }
                    .disclaimer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; }
                  </style>
                  </head>
                  <body>
                    <div class="header">
                      <h1>${platform?.name || 'Prescribe Pro'}</h1>
                      <p>${platform?.address || ''}</p>
                      <p>${platform?.phone || ''}</p>
                    </div>
                    <div class="title">
                      <h2>Voucher</h2>
                      <p>Subscription Confirmation</p>
                    </div>
                    <table><tr><td style="border:none;padding:4px 12px;width:auto;color:#666;">Voucher #:</td><td style="border:none;padding:4px 12px;font-weight:bold;font-family:monospace;">VCH-${(item.subscription?.id || '').slice(0, 8).toUpperCase()}</td><td style="border:none;padding:4px 12px;width:auto;color:#666;text-align:right;">Date:</td><td style="border:none;padding:4px 12px;font-weight:bold;text-align:right;">${fmt(item.subscription?.startDate)}</td></tr></table>
                    <table><tr><th colspan="2">Doctor Information</th></tr><tr><td>Name</td><td style="font-weight:bold">${item.doctor?.fullName || '—'}</td></tr><tr><td>BMDC No</td><td style="font-weight:bold">${item.doctor?.bmdcRegNo || '—'}</td></tr><tr><td>Clinic</td><td style="font-weight:bold">${item.doctor?.clinicName || '—'}</td></tr><tr><td>Degree</td><td style="font-weight:bold">${(item.doctor?.degree || []).join(', ') || '—'}</td></tr></table>
                    <table><tr><th colspan="2">Subscription Details</th></tr><tr><td>Plan</td><td style="font-weight:bold">${item.subscription?.plan?.name || '—'}</td></tr><tr><td>Amount</td><td style="font-weight:bold">${item.subscription?.plan?.price != null ? Number(item.subscription.plan.price).toLocaleString() + ' BDT' : '—'}</td></tr><tr><td>Duration</td><td style="font-weight:bold">${item.subscription?.plan?.duration || '—'} days</td></tr><tr><td>Status</td><td style="font-weight:bold;color:#15803d;">ACTIVE</td></tr><tr><td>Period</td><td style="font-weight:bold">${fmt(item.subscription?.startDate)} → ${fmt(item.subscription?.endDate)}</td></tr><tr><td>Limits</td><td style="font-weight:bold">${item.subscription?.patientLimit} patients / ${item.subscription?.prescriptionLimit} prescriptions</td></tr></table>
                    ${item.subscription?.payments?.[0] ? `<table><tr><th colspan="2">Payment Details</th></tr><tr><td>Transaction ID</td><td style="font-weight:bold;font-family:monospace;">${item.subscription.payments[0].transactionId || '—'}</td></tr><tr><td>Amount</td><td style="font-weight:bold">${item.subscription.payments[0].amount ? Number(item.subscription.payments[0].amount).toLocaleString() + ' BDT' : '—'}</td></tr><tr><td>Method</td><td style="font-weight:bold">${item.subscription.payments[0].paymentMethod || 'Manual'}</td></tr>${item.subscription.payments[0].notes ? `<tr><td>Notes</td><td style="font-weight:bold">${item.subscription.payments[0].notes}</td></tr>` : ''}</table>` : ''}
                    <table><tr><th colspan="2">Issued By</th></tr><tr><td>MR Name</td><td style="font-weight:bold">${mrInfo?.fullName || '—'}</td></tr><tr><td>Company</td><td style="font-weight:bold">${mrInfo?.company || '—'}</td></tr><tr><td>Phone</td><td style="font-weight:bold">${mrInfo?.phone || '—'}</td></tr></table>
                    <div class="footer">
                      <div><p style="margin:0;font-size:11px;color:#999;">Authorized Signature</p><div class="sig"></div></div>
                      <div style="text-align:right;"><p style="margin:0;font-size:11px;font-weight:bold;">${platform?.name || 'Prescribe Pro'}</p><p style="margin:0;font-size:11px;color:#999;">${platform?.address || ''}</p><p style="margin:0;font-size:11px;color:#999;">${platform?.phone || ''}</p></div>
                    </div>
                    <div class="disclaimer">This is a computer-generated voucher. No signature required.</div>
                    <script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script>
                  </body>
                  </html>
                `);
                w.document.close();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Printer className="h-4 w-4 text-teal-500" /> Print Voucher

            </button>
          )}
        </div>,
        document.body
      )}

    </div>
  );
}