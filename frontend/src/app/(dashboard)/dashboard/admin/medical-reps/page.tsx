'use client';

import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMrs, useCreateMr, useUpdateMr, useDeleteMr, useAssignDoctors, useAvailableDoctors, mrKeys } from '@/features/mr/hooks';
import { useToggleUserStatus } from '@/features/dashboard/hooks';
import { useCompanySearch } from '@/features/medicine/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Trash2, UserRound, Mail, Phone, Building2, Stethoscope, MoreHorizontal, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const createMrSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(5, 'Phone number is required'),
  company: z.string().min(1, 'Company is required'),
});

type CreateMrForm = z.infer<typeof createMrSchema>;

export default function AdminMedicalRepsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignMrId, setAssignMrId] = useState<string | null>(null);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [searchAssign, setSearchAssign] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMr, setEditMr] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editCompanyQuery, setEditCompanyQuery] = useState('');
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const editCompanyRef = useRef<HTMLDivElement>(null);
  const editCompanySearch = useCompanySearch(editCompanyQuery);

  const { data, isLoading, isFetching } = useMrs({ page, limit: 10, search, status });
  const createMr = useCreateMr();
  const updateMr = useUpdateMr();
  const deleteMr = useDeleteMr();
  const assignDoctors = useAssignDoctors();
  const qc = useQueryClient();
  const toggleStatus = useToggleUserStatus();
  const { data: availableDoctors } = useAvailableDoctors();
  const [menuTarget, setMenuTarget] = useState<{ id: string; top: number; right: number } | null>(null);
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyOpen, setCompanyOpen] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);
  const companySearch = useCompanySearch(companyQuery);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setCompanyOpen(false);
      }
      if (editCompanyRef.current && !editCompanyRef.current.contains(e.target as Node)) {
        setEditCompanyOpen(false);
      }
    };
    document.addEventListener('mouseup', handle);
    return () => document.removeEventListener('mouseup', handle);
  }, []);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateMrForm>({
    resolver: zodResolver(createMrSchema),
  });

  const onSubmit = (formData: CreateMrForm) => {
    createMr.mutate(formData, {
      onSuccess: () => {
        setCreateOpen(false);
        setCompanyQuery('');
        setCompanyOpen(false);
        reset();
      },
    });
  };

  const handleAssign = (mrId: string) => {
    assignDoctors.mutate(
      { mrId, data: { doctorIds: selectedDoctors } },
      { onSuccess: () => { setAssignMrId(null); setSelectedDoctors([]); } }
    );
  };

  const openAssign = (mr: any) => {
    setAssignMrId(mr.id);
    setSelectedDoctors(mr.doctors?.map((d: any) => d.doctor.id) || []);
  };

  const openEdit = (mr: any) => {
    setEditMr(mr);
    setEditForm({
      fullName: mr.fullName || '',
      phone: mr.phone || '',
      company: mr.company || '',
      department: mr.department || '',
      designation: mr.designation || '',
    });
    setEditCompanyQuery(mr.company || '');
    setEditCompanyOpen(false);
  };

  const handleEditSubmit = () => {
    if (!editMr) return;
    updateMr.mutate(
      { id: editMr.id, data: editForm },
      { onSuccess: () => { setEditMr(null); setEditCompanyQuery(''); setEditCompanyOpen(false); } }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Representatives</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage MRs and their doctor assignments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); setCompanyQuery(''); setCompanyOpen(false); }}>
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
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Md. Rahim" {...register('fullName')} />
                </div>
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="email" placeholder="mr@example.com" {...register('email')} />
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
              <div className="space-y-2">
                <Label>Company <span className="text-red-500">*</span></Label>
                <div className="relative" ref={companyRef}>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="Type to search company..."
                      value={companyQuery}
                      onChange={(e) => { setCompanyQuery(e.target.value); setValue('company', e.target.value); setCompanyOpen(e.target.value.length >= 2); }}
                      onFocus={() => { if (companyQuery.length >= 2) setCompanyOpen(true); }}
                    />
                  </div>
                  {companyOpen && companyQuery.length >= 2 && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl">
                      {companySearch.isLoading ? (
                        <p className="text-sm text-gray-400 text-center py-3">Searching...</p>
                      ) : companySearch.data?.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-3">No companies found</p>
                      ) : (
                        companySearch.data?.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setValue('company', c.name); setCompanyQuery(c.name); setCompanyOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                          >
                            {c.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.company && <p className="text-xs text-red-500">{errors.company.message}</p>}
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

      <Dialog open={!!editMr} onOpenChange={(v) => { if (!v) { setEditMr(null); setEditCompanyQuery(''); setEditCompanyOpen(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medical Representative</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  value={editForm.fullName || ''}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company <span className="text-red-500">*</span></Label>
              <div className="relative" ref={editCompanyRef}>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Type to search company..."
                    value={editCompanyQuery}
                    onChange={(e) => { setEditCompanyQuery(e.target.value); setEditForm({ ...editForm, company: e.target.value }); setEditCompanyOpen(e.target.value.length >= 2); }}
                    onFocus={() => { if (editCompanyQuery.length >= 2) setEditCompanyOpen(true); }}
                  />
                </div>
                {editCompanyOpen && editCompanyQuery.length >= 2 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl">
                    {editCompanySearch.isLoading ? (
                      <p className="text-sm text-gray-400 text-center py-3">Searching...</p>
                    ) : editCompanySearch.data?.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">No companies found</p>
                    ) : (
                      editCompanySearch.data?.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setEditForm({ ...editForm, company: c.name }); setEditCompanyQuery(c.name); setEditCompanyOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                        >
                          {c.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={editForm.department || ''}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input
                  value={editForm.designation || ''}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-white" disabled={updateMr.isPending}>
              {updateMr.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

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
                <TableHead>Company</TableHead>
                <TableHead>Assigned Doctors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                      <span className="text-sm text-muted-foreground">{mr.company}</span>
                    </TableCell>
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
                  <button
                    onClick={() => { openEdit(mr); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <Pencil className="h-4 w-4 text-blue-500" /> Edit
                  </button>
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

      <Dialog open={!!assignMrId} onOpenChange={(open) => { if (!open) { setAssignMrId(null); setSelectedDoctors([]); setSearchAssign(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Doctors to MR</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              placeholder="Search by name, BMDC no, or email..."
              value={searchAssign}
              onChange={(e) => setSearchAssign(e.target.value)}
              className="premium-input w-full h-10 px-4 text-sm"
            />
            <div className="max-h-72 overflow-y-auto space-y-2">
            {(() => {
              const list = availableDoctors || [];
              const filtered = searchAssign
                ? list.filter((doc: any) =>
                    doc.fullName.toLowerCase().includes(searchAssign.toLowerCase()) ||
                    doc.bmdcRegNo?.toLowerCase().includes(searchAssign.toLowerCase()) ||
                    doc.user?.email?.toLowerCase().includes(searchAssign.toLowerCase())
                  )
                : list;
              if (filtered.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No doctors match your search</p>;
              return filtered.map((doc: any) => (
                <label
                  key={doc.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
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
                    <p className="text-xs text-muted-foreground/60">{doc.user?.email}{doc.bmdcRegNo ? ` • ${doc.bmdcRegNo}` : ''}</p>
                  </div>
                </label>
              ));
            })()}
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
