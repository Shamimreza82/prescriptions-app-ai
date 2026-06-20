'use client';

import { useState } from 'react';
import { useAdminDoctors, useClearDoctorMrAssignments, useToggleDoctorVerification } from '@/features/dashboard/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/admin/DataTable';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserX, ShieldCheck, Eye, CheckCircle, XCircle, User, Mail, Phone, Award, Stethoscope, Building2, MapPin, FileText, Calendar, Clock, MoreHorizontal } from 'lucide-react';

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clearDoctorId, setClearDoctorId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [menuTarget, setMenuTarget] = useState<{ doc: any; top: number; right: number } | null>(null);
  const { data, isLoading } = useAdminDoctors({ page, limit: 10, search, verified: verifiedFilter !== 'all' ? verifiedFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined });
  const clearMr = useClearDoctorMrAssignments();
  const toggleVerify = useToggleDoctorVerification();

  const clearTarget = data?.data?.find((d: any) => d.id === clearDoctorId);

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Doctors</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage registered doctors & approve profiles</p>
      </div>

      <ConfirmDialog
        open={!!clearDoctorId}
        onOpenChange={(v) => !v && setClearDoctorId(null)}
        title="Clear MR Assignments"
        message={`Are you sure you want to remove all MR assignments for ${clearTarget?.fullName || 'this doctor'}?`}
        confirmLabel="Clear All"
        variant="destructive"
        loading={clearMr.isPending}
        onConfirm={() => clearDoctorId && clearMr.mutate(clearDoctorId, { onSuccess: () => setClearDoctorId(null) })}
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <Select value={verifiedFilter} onValueChange={(v) => { setVerifiedFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Verified" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <>
          <div className="premium-card-static">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>BMDC No</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MRs</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Prescriptions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No doctors found</TableCell></TableRow>
                ) : (
                  data?.data?.map((doc: any) => {
                    const mrs = doc.mrAssignments || [];
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <button onClick={() => setSelectedDoctor(doc)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">
                            {doc.fullName}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{doc.bmdcRegNo || '—'}</TableCell>
                        <TableCell>{doc.user?.email}</TableCell>
                        <TableCell>
                          {doc.user?.isVerified ? (
                            <Badge variant="success" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                              <CheckCircle className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                              <XCircle className="h-3 w-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.user?.isActive ? 'success' : 'destructive'}>
                            {doc.user?.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="badge-gradient-blue">{(doc.mrAssignments || []).length} MR{(doc.mrAssignments || []).length !== 1 ? 's' : ''}</span>
                        </TableCell>
                        <TableCell>{doc._count?.patients || 0}</TableCell>
                        <TableCell>{doc._count?.prescriptions || 0}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              const rect = (e.target as HTMLElement).closest('button')!.getBoundingClientRect();
                              setMenuTarget(menuTarget?.doc.id === doc.id ? null : { doc, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
      {menuTarget && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuTarget(null)} />
          <div
            className="fixed z-50 w-48 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong py-1.5 animate-scale-in"
            style={{ top: menuTarget.top, right: menuTarget.right }}
          >
            <button
              onClick={() => { setSelectedDoctor(menuTarget.doc); setMenuTarget(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Eye className="h-4 w-4 text-blue-500" /> View Details
            </button>
            <button
              disabled={toggleVerify.isPending}
              onClick={() => { toggleVerify.mutate(menuTarget.doc.user.id); setMenuTarget(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className={`h-4 w-4 ${menuTarget.doc.user?.isVerified ? 'text-amber-500' : 'text-emerald-500'}`} />
              {menuTarget.doc.user?.isVerified ? 'Unverify Doctor' : 'Approve Doctor'}
            </button>
            <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
            <button
              disabled={(menuTarget.doc.mrAssignments || []).length === 0 || clearMr.isPending}
              onClick={() => { setClearDoctorId(menuTarget.doc.id); setMenuTarget(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              <UserX className="h-4 w-4" /> Clear MR Assignments
            </button>
          </div>
        </>
      )}

      {/* Doctor Detail Dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={(v) => { if (!v) setSelectedDoctor(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow flex items-center justify-center text-white font-bold text-lg">
                {(selectedDoctor?.fullName || '?').charAt(0)}
              </div>
              <div>
                <p className="text-lg font-bold">{selectedDoctor?.fullName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={selectedDoctor?.user?.isVerified ? 'success' : 'secondary'}>
                    {selectedDoctor?.user?.isVerified ? 'Verified' : 'Pending Approval'}
                  </Badge>
                  <Badge variant={selectedDoctor?.user?.isActive ? 'success' : 'destructive'}>
                    {selectedDoctor?.user?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-5">
              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" /> Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <User className="h-4 w-4 text-blue-600 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Full Name</p><p className="text-sm font-medium">{selectedDoctor.fullName}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium truncate">{selectedDoctor.user?.email}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium">{selectedDoctor.phone || '—'}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm font-medium">{formatDate(selectedDoctor.createdAt)}</p></div>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" /> Professional Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <Award className="h-4 w-4 text-purple-600 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Degree</p><p className="text-sm font-medium">{(selectedDoctor.degree || []).join(', ') || '—'}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <Stethoscope className="h-4 w-4 text-purple-600 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Specialization</p><p className="text-sm font-medium">{(selectedDoctor.specialization || []).join(', ') || '—'}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">BMDC Reg No</p><p className="text-sm font-medium font-mono">{selectedDoctor.bmdcRegNo || '—'}</p></div>
                  </div>
                </div>
              </div>

              {/* Clinic Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" /> Clinic Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Clinic Name</p><p className="text-sm font-medium">{selectedDoctor.clinicName || '—'}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Address</p><p className="text-sm font-medium truncate">{selectedDoctor.clinicAddress || '—'}</p></div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Activity Overview</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedDoctor._count?.patients || 0}</p>
                    <p className="text-xs text-muted-foreground">Patients</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedDoctor._count?.prescriptions || 0}</p>
                    <p className="text-xs text-muted-foreground">Prescriptions</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedDoctor._count?.appointments || 0}</p>
                    <p className="text-xs text-muted-foreground">Appointments</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/50">
                <Button
                  className="flex-1 gradient-primary text-white shadow-glow hover:opacity-90"
                  disabled={toggleVerify.isPending}
                  onClick={() => {
                    toggleVerify.mutate(selectedDoctor.user.id, { onSuccess: () => setSelectedDoctor(null) });
                  }}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {toggleVerify.isPending ? 'Updating...' : selectedDoctor.user?.isVerified ? 'Unverify Doctor' : 'Approve Doctor'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedDoctor(null)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
