'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMyDoctors } from '@/features/mr/hooks';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { FileText, Stethoscope, ArrowLeft, Eye, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function MrDoctorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyDoctors({ page, search: search || undefined });

  const doctors = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mr" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assigned Doctors</h1>
          <p className="text-sm text-muted-foreground mt-1">View all doctors assigned to you</p>
        </div>
      </div>

      <SearchBar value={search} onChange={handleSearch} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !doctors.length ? (
        <div className="premium-card-static p-12 text-center">
          <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Doctors Assigned</h3>
          <p className="text-sm text-muted-foreground">
            {search ? 'No doctors match your search.' : "You haven&apos;t been assigned to any doctors yet."}
          </p>
        </div>
      ) : (
        <div className="premium-card-static overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>BMDC Reg No</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Prescriptions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doc: any) => (
                <TableRow
                  key={doc.id}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/mr/doctors/${doc.id}/prescriptions`} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                      {doc.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{doc.clinicName || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {doc.bmdcRegNo || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{doc._count?.patients || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{doc._count?.prescriptions || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/mr/doctors/${doc.id}/prescriptions`)}>
                          <Eye className="h-4 w-4" /> View Prescriptions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
