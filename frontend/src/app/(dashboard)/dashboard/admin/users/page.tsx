'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminUsers, useToggleUserStatus } from '@/features/dashboard/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Eye, MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [verified, setVerified] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers({ page, limit: 10, search, status, verified, role });
  const toggleStatus = useToggleUserStatus();
  const [toggleTarget, setToggleTarget] = useState<{ id: string; email: string; isActive: boolean } | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Users</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage platform users</p>
      </div>

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
        <select
          value={verified}
          onChange={(e) => { setVerified(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Verification</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="DOCTOR">Doctor</option>
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="MEDICAL_REPRESENTATIVE">Medical Representative</option>
        </select>
      </div>

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(v) => { if (!v) setToggleTarget(null); }}
        title={toggleTarget?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${toggleTarget?.isActive ? 'deactivate' : 'activate'} "${toggleTarget?.email}"? ${toggleTarget?.isActive ? 'They will not be able to log in.' : ''}`}
        confirmLabel={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.isActive ? 'destructive' : 'default'}
        loading={toggleStatus.isPending}
        onConfirm={() => {
          if (toggleTarget) {
            toggleStatus.mutate(toggleTarget.id, { onSuccess: () => setToggleTarget(null) });
          }
        }}
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <>
          <div className="premium-card-static overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Doctor Profile</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                ) : (
                  data?.data?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell><Badge variant={user.role === 'SUPER_ADMIN' ? 'warning' : user.role === 'DOCTOR' ? 'success' : 'secondary'}>{user.role.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><Badge variant={user.isActive ? 'success' : 'destructive'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell><Badge variant={user.isVerified ? 'success' : 'secondary'}>{user.isVerified ? 'Yes' : 'No'}</Badge></TableCell>
                      <TableCell>{user.doctor?.fullName || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}>
                              <Eye className="h-4 w-4" /> Details
                            </DropdownMenuItem>
                            {user.role !== 'SUPER_ADMIN' && (
                              <DropdownMenuItem onClick={() => setToggleTarget({ id: user.id, email: user.email, isActive: user.isActive })}>
                                {user.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
    </div>
  );
}