'use client';

import { useState } from 'react';
import { useMyReceptionists, useCreateReceptionistByDoctor, useDeleteReceptionistByDoctor, useUpdateReceptionistByDoctor, useToggleReceptionistStatus, useResetReceptionistPassword } from '@/features/receptionist/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, MoreHorizontal, Trash2, UserRound, Mail, Phone, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createRecSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(5, 'Phone number is required'),
});

type CreateRecForm = z.infer<typeof createRecSchema>;

export default function DoctorReceptionistsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; fullName: string; phone: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ id: string; top: number; right: number } | null>(null);

  const { data, isLoading } = useMyReceptionists({ page, limit: 10, search });
  const createRec = useCreateReceptionistByDoctor();
  const updateRec = useUpdateReceptionistByDoctor();
  const toggleStatus = useToggleReceptionistStatus();
  const deleteRec = useDeleteReceptionistByDoctor();
  const resetPassword = useResetReceptionistPassword();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateRecForm>({
    resolver: zodResolver(createRecSchema),
  });

  const onSubmit = (formData: CreateRecForm) => {
    createRec.mutate(formData, {
      onSuccess: () => {
        setCreateOpen(false);
        reset();
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receptionists</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your clinic receptionists</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gradient-primary text-white shadow-glow">
              <Plus className="h-4 w-4 mr-2" /> Add Receptionist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Receptionist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Receptionist name" {...register('fullName')} />
                </div>
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="email" placeholder="rec@clinic.com" {...register('email')} />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Password <span className="text-red-500">*</span></Label>
                  <Input type="password" placeholder="Min 6 chars" {...register('password')} />
                  {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="+88017..." {...register('phone')} />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-white" disabled={createRec.isPending}>
                {createRec.isPending ? 'Creating...' : 'Create Receptionist'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Receptionist"
        message="Are you sure you want to delete this receptionist? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteRec.isPending}
        onConfirm={() => deleteId && deleteRec.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="premium-card-static">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <UserRound className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No receptionists found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((rec: any) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{rec.fullName}</TableCell>
                    <TableCell>{rec.user?.email}</TableCell>
                    <TableCell>{rec.phone}</TableCell>
                    <TableCell>
                      <Badge variant={rec.user?.isActive ? 'success' : 'destructive'}>
                        {rec.user?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          const rect = (e.target as HTMLElement).closest('button')!.getBoundingClientRect();
                          setMenuTarget(menuTarget?.id === rec.id ? null : { id: rec.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
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
              const rec = data.data.find((r: any) => r.id === menuTarget.id);
              if (!rec) return null;
              return (
                <>
                  <button
                    onClick={() => { setEditTarget({ id: rec.id, fullName: rec.fullName, phone: rec.phone }); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit Receptionist
                  </button>
                  <button
                    onClick={() => { toggleStatus.mutate(rec.id); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {rec.user?.isActive ? (
                      <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    ) : (
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {rec.user?.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { setResetTarget(rec.id); setMenuTarget(null); setNewPassword(''); setConfirmPassword(''); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <KeyRound className="h-4 w-4 text-purple-500" /> Change Password
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                  <button
                    onClick={() => { setDeleteId(rec.id); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Receptionist
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Edit Receptionist Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Receptionist</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={editTarget.fullName}
                  onChange={(e) => setEditTarget({ ...editTarget, fullName: e.target.value })}
                  className="h-11 premium-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone <span className="text-red-500">*</span></Label>
                <Input
                  value={editTarget.phone}
                  onChange={(e) => setEditTarget({ ...editTarget, phone: e.target.value })}
                  className="h-11 premium-input"
                />
              </div>
              <Button
                className="w-full h-11"
                disabled={!editTarget.fullName || updateRec.isPending}
                onClick={() => updateRec.mutate(
                  { id: editTarget.id, data: { fullName: editTarget.fullName, phone: editTarget.phone } },
                  { onSuccess: () => setEditTarget(null) }
                )}
              >
                {updateRec.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(v) => { if (!v) { setResetTarget(null); setNewPassword(''); setConfirmPassword(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">New Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 pr-11 premium-input"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 premium-input"
                placeholder="Re-enter new password"
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <Button
              className="w-full h-11"
              disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmPassword || resetPassword.isPending}
              onClick={() => resetTarget && resetPassword.mutate(
                { id: resetTarget, newPassword },
                { onSuccess: () => { setResetTarget(null); setNewPassword(''); setConfirmPassword(''); } }
              )}
            >
              {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
