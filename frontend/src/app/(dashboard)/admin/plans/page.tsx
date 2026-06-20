'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminGuard } from '@/hooks/useAuth';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '@/features/subscription/hooks';
import { CreatePlanInput, UpdatePlanInput } from '@/features/subscription/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const planSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  patientLimit: z.coerce.number().min(1, 'Patient limit must be at least 1'),
  prescriptionLimit: z.coerce.number().min(1, 'Prescription limit must be at least 1'),
});

type PlanFormData = z.infer<typeof planSchema>;

const defaultValues: PlanFormData = {
  name: '',
  description: '',
  price: 0,
  patientLimit: 50,
  prescriptionLimit: 100,
};

function PlanDialog({
  open,
  onOpenChange,
  plan,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: UpdatePlanInput & { name: string };
  onSubmit: (data: PlanFormData) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: plan || defaultValues,
  });

  const handleFormSubmit = (data: PlanFormData) => {
    onSubmit(data);
    if (!plan) reset(defaultValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Professional" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Plan description..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" min="0" step="0.01" {...register('price')} />
            {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientLimit">Patient Limit</Label>
              <Input id="patientLimit" type="number" min="1" {...register('patientLimit')} />
              {errors.patientLimit && <p className="text-xs text-red-500">{errors.patientLimit.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prescriptionLimit">Prescription Limit</Label>
              <Input id="prescriptionLimit" type="number" min="1" {...register('prescriptionLimit')} />
              {errors.prescriptionLimit && <p className="text-xs text-red-500">{errors.prescriptionLimit.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  planName,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Plan</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{planName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" disabled={loading} onClick={onConfirm}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PlansPage() {
  useAdminGuard();
  const { data: plans, isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const handleCreate = (data: PlanFormData) => {
    createPlan.mutate(data as CreatePlanInput, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const handleEdit = (data: PlanFormData) => {
    if (!selectedPlan) return;
    updatePlan.mutate(
      { id: selectedPlan.id, data: data as UpdatePlanInput },
      { onSuccess: () => { setEditOpen(false); setSelectedPlan(null); } }
    );
  };

  const handleDelete = () => {
    if (!selectedPlan) return;
    deletePlan.mutate(selectedPlan.id, {
      onSuccess: () => { setDeleteOpen(false); setSelectedPlan(null); },
    });
  };

  const openEdit = (plan: any) => {
    setSelectedPlan(plan);
    setEditOpen(true);
  };

  const openDelete = (plan: any) => {
    setSelectedPlan(plan);
    setDeleteOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pricing plans and limits</p>
        </div>
        <PlanDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
          loading={createPlan.isPending}
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <Card className="premium-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Patient Limit</TableHead>
                <TableHead>Prescription Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No plans found. Create your first plan to get started.
                  </TableCell>
                </TableRow>
              )}
              {plans?.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {plan.description || '-'}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {plan.price === 0 ? 'Free' : `${plan.price.toFixed(2)}`}
                    </span>
                  </TableCell>
                  <TableCell>{plan.patientLimit.toLocaleString()}</TableCell>
                  <TableCell>{plan.prescriptionLimit.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDelete(plan)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PlanDialog
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) setSelectedPlan(null); }}
        plan={selectedPlan ? {
          name: selectedPlan.name,
          description: selectedPlan.description || '',
          price: selectedPlan.price,
          patientLimit: selectedPlan.patientLimit,
          prescriptionLimit: selectedPlan.prescriptionLimit,
        } : undefined}
        onSubmit={handleEdit}
        loading={updatePlan.isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => { setDeleteOpen(open); if (!open) setSelectedPlan(null); }}
        planName={selectedPlan?.name || ''}
        onConfirm={handleDelete}
        loading={deletePlan.isPending}
      />
    </div>
  );
}
