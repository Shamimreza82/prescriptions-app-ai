'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useTrackedMedicines,
  useAddTrackedMedicine,
  useToggleTrackedMedicine,
  useRemoveTrackedMedicine,
} from '@/features/mr/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SearchBar } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Search, Package, Plus, Trash2, ArrowLeft, Loader2, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

function AddMedicineDialog({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const addMedicine = useAddTrackedMedicine();

  const handleSearch = async (q: string) => {
    setSearchTerm(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MEDICINE_API_URL || 'http://localhost:4000/api/v1'}/medicines/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setResults(data?.data?.brands || data?.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (med: any) => {
    addMedicine.mutate(
      {
        name: med.name || med.brand_name || med,
        genericName: med.generic?.name || med.generic_name,
        strength: med.strength,
        form: med.form || med.dosage_form,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSearchTerm('');
          setResults([]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) onClose(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Medicine to Tracking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medicine name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg divide-y">
              {results.slice(0, 20).map((med: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleAdd(med)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {med.name || med.brand_name || med}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[med.strength, med.form || med.dosage_form, med.generic?.name || med.generic_name]
                        .filter(Boolean)
                        .join(' — ') || '—'}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-indigo-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {!loading && searchTerm.length >= 2 && results.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No medicines found. Try a different search term.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TrackedMedicinesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTrackedMedicines({ page, search: search || undefined });
  const toggleMedicine = useToggleTrackedMedicine();
  const removeMedicine = useRemoveTrackedMedicine();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const medicines = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
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
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/mr/audit"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tracked Medicines</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage the list of medicines you want to monitor across your assigned doctors
            </p>
          </div>
        </div>
        <AddMedicineDialog onClose={() => {}} />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={handleSearch} />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Remove Medicine"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from tracking?`}
        confirmLabel="Remove"
        variant="destructive"
        loading={removeMedicine.isPending}
        onConfirm={() =>
          deleteTarget &&
          removeMedicine.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
      />

      <Card className="p-5 premium-card-static">
        {medicines.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.map((med: any) => (
                  <TableRow key={med.id}>
                    <TableCell className="text-sm font-medium">{med.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{med.genericName || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{med.strength || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{med.form || '—'}</TableCell>
                    <TableCell>
                      <Badge className={med.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                        {med.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(med.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleMedicine.mutate(med.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title={med.isActive ? 'Pause tracking' : 'Resume tracking'}
                        >
                          {med.isActive ? (
                            <ToggleRight className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: med.id, name: med.name })}
                          disabled={removeMedicine.isPending && deleteTarget?.id === med.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remove from tracking"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <div className="text-center py-12 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No medicines tracked</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search
                ? 'No medicines match your search. Try a different term.'
                : 'Search for your company&apos;s medicines using the medicine database and add them here. The audit dashboard will then monitor how often these medicines are prescribed.'}
            </p>
            <div className="flex justify-center">
              <AddMedicineDialog onClose={() => {}} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
