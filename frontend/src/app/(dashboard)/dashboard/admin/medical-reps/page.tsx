'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMrs, useCreateMr, useDeleteMr, useAssignDoctors, useAvailableDoctors, mrKeys } from '@/features/mr/hooks';
import { useToggleUserStatus } from '@/features/dashboard/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Trash2, UserRound, Mail, Phone, Stethoscope, MoreHorizontal, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const createMrSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(5, 'Phone number is required'),
});

type CreateMrForm = z.infer<typeof createMrSchema>;

export default function AdminMedicalRepsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignMrId, setAssignMrId] = useState<string | null>(null);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useMrs({ page, limit: 10, search, status });
  const createMr = useCreateMr();
  const deleteMr = useDeleteMr();
  const assignDoctors = useAssignDoctors();
  const qc = useQueryClient();
  const toggleStatus = useToggleUserStatus();
  const { data: availableDoctors } = useAvailableDoctors();
  const [menuTarget, setMenuTarget] = useState<{ id: string; top: number; right: number } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMrForm>({
    resolver: zodResolver(createMrSchema),
  });

  const onSubmit = (formData: CreateMrForm) => {
    createMr.mutate(formData, {
      onSuccess: () => {
        setCreateOpen(false);
        reset();
      },
    });
  };

  const handleAssign = (mrId: string) => {
    if (selectedDoctors.length === 0) {
      toast.error('Select at least one doctor');
      return;
    }
    assignDoctors.mutate(
      { mrId, data: { doctorIds: selectedDoctors } },
      { onSuccess: () => { setAssignMrId(null); setSelectedDoctors([]); } }
    );
  };

  const openAssign = (mr: any) => {
    setAssignMrId(mr.id);
    setSelectedDoctors(mr.doctors?.map((d: any) => d.doctor.id) || []);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Representatives</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage MRs and their doctor assignments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gradient-primary text-white shadow-glow">
              <Plus className="h-4 w-4 mr-2" /> Add MR
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Medical Representative</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Md. Rahim" {...register('fullName')} />
                </div>
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="email" placeholder="mr@example.com" {...register('email')} />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Min 6 chars" {...register('password')} />
                  {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="+88017..." {...register('phone')} />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-white" disabled={createMr.isPending}>
                {createMr.isPending ? 'Creating...' : 'Create MR'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete MR"
        message="Are you sure you want to delete this medical representative? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMr.isPending}
        onConfirm={() => deleteId && deleteMr.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Inactive</option>
        </select>
      </div>

      {isLoading && !data ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="premium-card-static relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-950/50 z-10 flex items-start justify-center pt-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned Doctors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <UserRound className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No medical representatives found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((mr: any) => (
                  <TableRow key={mr.id}>
                    <TableCell className="font-medium">{mr.fullName}</TableCell>
                    <TableCell>{mr.user?.email}</TableCell>
                    <TableCell>{mr.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{mr.doctors?.length || 0} doctors</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mr.user?.isActive ? 'success' : 'destructive'}>
                        {mr.user?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          const rect = (e.target as HTMLElement).closest('button')!.getBoundingClientRect();
                          setMenuTarget(menuTarget?.id === mr.id ? null : { id: mr.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
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
            className="fixed z-50 w-52 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong py-1.5 animate-scale-in"
            style={{ top: menuTarget.top, right: menuTarget.right }}
          >
            {(() => {
              const mr = data.data.find((m: any) => m.id === menuTarget.id);
              if (!mr) return null;
              return (
                <>
                  <button
                    onClick={() => { openAssign(mr); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <Stethoscope className="h-4 w-4 text-teal-500" /> Assign Doctors
                  </button>
                  {mr.user?.isActive ? (
                    <button
                      onClick={() => { toggleStatus.mutate(mr.user.id, { onSuccess: () => qc.invalidateQueries({ queryKey: mrKeys.mrs }) }); setMenuTarget(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <ToggleLeft className="h-4 w-4 text-amber-500" /> Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => { toggleStatus.mutate(mr.user.id, { onSuccess: () => qc.invalidateQueries({ queryKey: mrKeys.mrs }) }); setMenuTarget(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <ToggleRight className="h-4 w-4 text-emerald-500" /> Activate
                    </button>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                  <button
                    onClick={() => { setDeleteId(mr.id); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete MR
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      <Dialog open={!!assignMrId} onOpenChange={(open) => { if (!open) { setAssignMrId(null); setSelectedDoctors([]); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Doctors to MR</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              placeholder="Search doctors..."
              className="premium-input w-full h-10 px-4 text-sm"
              onChange={(e) => {
                const val = e.target.value.toLowerCase();
                const items = document.querySelectorAll('.assign-doctor-item');
                items.forEach((el) => {
                  const text = el.textContent?.toLowerCase() || '';
                  el.classList.toggle('hidden', !text.includes(val));
                });
              }}
            />
            <div className="max-h-72 overflow-y-auto space-y-2">
            {availableDoctors?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active doctors available</p>
            ) : (
              availableDoctors?.map((doc: any) => (
                <label
                  key={doc.id}
                  className={`assign-doctor-item flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedDoctors.includes(doc.id)
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    checked={selectedDoctors.includes(doc.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDoctors([...selectedDoctors, doc.id]);
                      } else {
                        setSelectedDoctors(selectedDoctors.filter((id) => id !== doc.id));
                      }
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.fullName}</p>
                    <p className="text-xs text-muted-foreground">{doc.clinicName}</p>
                    <p className="text-xs text-muted-foreground/60">{doc.user?.email} {doc.bmdcRegNo ? `• ${doc.bmdcRegNo}` : ''}</p>
                  </div>
                </label>
              ))
              )}
            </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setAssignMrId(null); setSelectedDoctors([]); }}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              onClick={() => assignMrId && handleAssign(assignMrId)}
              disabled={assignDoctors.isPending}
            >
              {assignDoctors.isPending ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
