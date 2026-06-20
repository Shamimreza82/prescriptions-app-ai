'use client';

import { useState, useEffect } from 'react';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '@/features/plans/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Plan } from '@/features/plans/types';

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
  patientLimit: z.coerce.number().int().min(0),
  prescriptionLimit: z.coerce.number().int().min(0),
  duration: z.coerce.number().int().min(1, 'Duration must be >= 1 day'),
});

type PlanForm = z.infer<typeof planSchema>;

function PlanFormDialog({ plan, open, onOpenChange }: { plan?: Plan; open: boolean; onOpenChange: (v: boolean) => void }) {
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const isEdit = !!plan;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      patientLimit: 50,
      prescriptionLimit: 100,
      duration: 30,
    },
  });

  useEffect(() => {
    if (open) {
      reset(plan ? {
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        patientLimit: plan.patientLimit,
        prescriptionLimit: plan.prescriptionLimit,
        duration: plan.duration,
      } : {
        name: '',
        description: '',
        price: 0,
        patientLimit: 50,
        prescriptionLimit: 100,
        duration: 30,
      });
    }
  }, [plan, open, reset]);

  const onSubmit = (data: PlanForm) => {
    const formatted = { ...data, description: data.description || undefined };
    if (isEdit) {
      updatePlan.mutate({ id: plan.id, data: formatted }, { onSuccess: () => onOpenChange(false) });
    } else {
      createPlan.mutate(formatted as any, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
            <input {...register('name')} className="premium-input w-full h-11 px-4" placeholder="Plan name" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input {...register('description')} className="premium-input w-full h-11 px-4" placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price ($) <span className="text-red-500">*</span></label>
              <input {...register('price')} type="number" step="0.01" className="premium-input w-full h-11 px-4" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (days) <span className="text-red-500">*</span></label>
              <input {...register('duration')} type="number" className="premium-input w-full h-11 px-4" />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient Limit <span className="text-red-500">*</span></label>
              <input {...register('patientLimit')} type="number" className="premium-input w-full h-11 px-4" />
              {errors.patientLimit && <p className="text-xs text-red-500 mt-1">{errors.patientLimit.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prescription Limit <span className="text-red-500">*</span></label>
              <input {...register('prescriptionLimit')} type="number" className="premium-input w-full h-11 px-4" />
              {errors.prescriptionLimit && <p className="text-xs text-red-500 mt-1">{errors.prescriptionLimit.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createPlan.isPending || updatePlan.isPending}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPlansPage() {
  const { data: plans, isLoading } = usePlans();
  const deletePlan = useDeletePlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage subscription plans</p>
        </div>
        <Button onClick={() => { setEditingPlan(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Plan
        </Button>
      </div>

      <PlanFormDialog plan={editingPlan} open={dialogOpen} onOpenChange={setDialogOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Delete Plan"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deletePlan.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deletePlan.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }
        }}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
      ) : !plans?.length ? (
        <div className="premium-card-static p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Plans</h3>
          <p className="text-sm text-muted-foreground">Create your first subscription plan.</p>
        </div>
      ) : (
        <div className="premium-card-static overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Patient Limit</TableHead>
                <TableHead>Rx Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan: Plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.price}</TableCell>
                  <TableCell>{plan.duration > 0 ? `${plan.duration} days` : 'Unlimited'}</TableCell>
                  <TableCell>{plan.patientLimit}</TableCell>
                  <TableCell>{plan.prescriptionLimit}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'success' : 'destructive'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingPlan(plan); setDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(plan)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
