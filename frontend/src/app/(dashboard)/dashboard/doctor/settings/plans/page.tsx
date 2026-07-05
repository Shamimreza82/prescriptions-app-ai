'use client';

import { useState } from 'react';
import { usePlans, useActivatePlan, useMySubscription } from '@/features/plans/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Crown, Loader2, CreditCard, Clock } from 'lucide-react';
import type { Plan } from '@/features/plans/types';

export default function DoctorPlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const { data: plans, isLoading } = usePlans();
  const { data: subscription, isLoading: loadingSub } = useMySubscription();
  const activatePlan = useActivatePlan();

  const isCurrentPlanActive = !!(subscription?.planId && subscription?.status === 'ACTIVE');
  const isCurrentPlanPending = !!(subscription?.planId && subscription?.status === 'PENDING');
  const hasActiveOrPendingSub = isCurrentPlanActive || isCurrentPlanPending;

  const handleSubscribe = (plan: Plan) => {
    if (plan.price > 0) {
      setSelectedPlan(plan);
      setTransactionId('');
      setPaymentNotes('');
    } else {
      activatePlan.mutate({ planId: plan.id });
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedPlan) return;
    activatePlan.mutate(
      { planId: selectedPlan.id, transactionId: transactionId.trim(), notes: paymentNotes.trim() || undefined },
      {
        onSuccess: () => {
          setSelectedPlan(null);
          setTransactionId('');
          setPaymentNotes('');
        },
      },
    );
  };

  if (isLoading || loadingSub) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const planStatus = (planId: string) => {
    if (subscription?.planId === planId && subscription?.status === 'ACTIVE') return 'active';
    if (subscription?.planId === planId && subscription?.status === 'PENDING') return 'pending';
    return 'none';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a plan that fits your practice</p>
      </div>

      {subscription && (
        <div className="premium-card-static p-4 flex items-center gap-3">
          <Crown className="h-5 w-5 text-amber-500" />
          <span className="text-sm">
            Current plan: <strong>{subscription.plan?.name || 'Free'}</strong>
            {' | '}
            <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'warning'}>
              {subscription.status}
            </Badge>
            {' | '}
            {subscription.patientLimit} patients / {subscription.prescriptionLimit} prescriptions
            {subscription.endDate && (
              <> | Expires: {new Date(subscription.endDate).toLocaleDateString()}</>
            )}
          </span>
        </div>
      )}

      <Dialog open={!!selectedPlan} onOpenChange={(v) => !v && setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedPlan?.name} Plan</p>
                <p className="text-xs text-muted-foreground">৳{selectedPlan?.price} for {selectedPlan?.duration} days</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Transaction ID</label>
              <input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="premium-input w-full h-11 px-4"
                placeholder="Enter transaction or payment ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="premium-input w-full px-4 py-2.5 resize-none"
                rows={3}
                placeholder="Additional notes for admin verification"
              />
            </div>
            <Button
              className="w-full"
              disabled={!transactionId.trim() || activatePlan.isPending}
              onClick={handleConfirmPayment}
            >
              {activatePlan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Activate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan: Plan) => {
          const status = planStatus(plan.id);
          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col border-2 transition-all duration-200 ${
                status === 'active'
                  ? 'border-teal-500 dark:border-teal-400 shadow-glow'
                  : status === 'pending'
                  ? 'border-amber-400 dark:border-amber-600'
                  : 'border-gray-100 dark:border-gray-800/50 hover:border-teal-300 dark:hover:border-teal-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                {status === 'active' && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Active
                  </Badge>
                )}
                {status === 'pending' && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pending
                  </Badge>
                )}
              </div>

              {plan.description && (
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              )}

              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                ৳{plan.price}
                <span className="text-sm font-normal text-muted-foreground">
                  {plan.duration > 0 ? ` / ${plan.duration} days` : ''}
                </span>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>{plan.patientLimit} patient{plan.patientLimit !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>{plan.prescriptionLimit} prescription{plan.prescriptionLimit !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>{plan.duration > 0 ? `${plan.duration}-day` : 'Unlimited'} duration</span>
                </div>
              </div>

              <Button
                className="w-full"
                variant={status === 'active' ? 'outline' : status === 'pending' ? 'outline' : plan.price === 0 ? 'secondary' : 'default'}
                disabled={status === 'active' || status === 'pending' || hasActiveOrPendingSub || (activatePlan.isPending && selectedPlan?.id === plan.id)}
                onClick={() => handleSubscribe(plan)}
              >
                {status === 'active'
                  ? 'Current Plan'
                  : status === 'pending'
                  ? 'Awaiting Approval'
                  : isCurrentPlanActive
                  ? subscription?.endDate
                    ? `Expires ${new Date(subscription.endDate).toLocaleDateString()}`
                    : 'Plan Active'
                  : isCurrentPlanPending
                  ? 'Approval Pending'
                  : plan.price === 0
                  ? 'Activate Free'
                  : 'Subscribe'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
