'use client';

import { useState } from 'react';
import { useMrSubscriptions, useSubscribeDoctor } from '@/features/mr/hooks';
import { usePlans } from '@/features/plans/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { Check, Crown, CreditCard, Loader2, Clock, XCircle, Stethoscope, AlertCircle, ArrowLeft } from 'lucide-react';
import type { MrSubscription, Plan } from '@/features/mr/types';
import Link from 'next/link';

export default function MrSubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
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
                        size="sm"
                        variant={hasActiveSub ? 'outline' : hasPendingSub ? 'outline' : 'default'}
                        disabled={hasPendingSub || subscribeDoctor.isPending}
                        onClick={() => openSubscribe(item.doctor.id)}
                      >
                        {subscribeDoctor.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : hasActiveSub ? 'Change' : hasPendingSub ? 'Pending' : 'Subscribe'}
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
    </div>
  );
}