'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePrescriptions, useDeletePrescription } from '@/features/prescriptions/hooks';
import { downloadPrescriptionPDF, printPrescriptionPDF } from '@/features/prescriptions/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Search, MoreHorizontal, Eye, Download, Trash2, Pencil } from 'lucide-react';

export default function PrescriptionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuTarget, setMenuTarget] = useState<{ id: string; top: number; right: number } | null>(null);
  const params = { page: String(page), limit: '20', search };
  const { data, isLoading } = usePrescriptions(params);
  const deleteRx = useDeletePrescription();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prescriptions</h1>
        <Link href="/prescriptions/new">
          <Button><Plus className="h-4 w-4 mr-2" />New Prescription</Button>
        </Link>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Prescription"
        message="Are you sure you want to delete this prescription? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteRx.isPending}
        onConfirm={() => deleteId && deleteRx.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by Rx no or patient..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No prescriptions yet</p>
              <Link href="/prescriptions/new"><Button variant="outline">Create your first prescription</Button></Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rx No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Medicines</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((rx: any) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-mono text-xs">{rx.prescriptionNo}</TableCell>
                      <TableCell className="font-medium">{rx.patient?.fullName}</TableCell>
                      <TableCell>{new Date(rx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{rx.diagnosis || '-'}</TableCell>
                      <TableCell>{rx.medicines?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            const rect = (e.target as HTMLElement).closest('button')!.getBoundingClientRect();
                            setMenuTarget(menuTarget?.id === rx.id ? null : { id: rx.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
                <Pagination
                  page={page}
                  totalPages={data?.totalPages || 1}
                  total={data?.total}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      {menuTarget && data?.data && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuTarget(null)} />
          <div
            className="fixed z-50 w-48 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong py-1.5 animate-scale-in"
            style={{ top: menuTarget.top, right: menuTarget.right }}
          >
            {(() => {
              const rx = data.data.find((r: any) => r.id === menuTarget.id);
              if (!rx) return null;
              return (
                <>
                  <Link href={`/prescriptions/${rx.id}`} onClick={() => setMenuTarget(null)}>
                    <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <Eye className="h-4 w-4 text-blue-500" /> View Details
                    </button>
                  </Link>
                  <Link href={`/prescriptions/${rx.id}/edit`} onClick={() => setMenuTarget(null)}>
                    <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <Pencil className="h-4 w-4 text-amber-500" /> Edit
                    </button>
                  </Link>
                  <button
                    onClick={() => { printPrescriptionPDF(rx.id); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <Download className="h-4 w-4 text-sky-500" /> Print
                  </button>
                  <button
                    onClick={() => { downloadPrescriptionPDF(rx.id); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <Download className="h-4 w-4 text-emerald-500" /> Download PDF
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                  <button
                    onClick={() => { setDeleteId(rx.id); setMenuTarget(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
