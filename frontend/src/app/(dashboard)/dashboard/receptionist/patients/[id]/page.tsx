'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useRecPatient } from '@/features/receptionist/hooks';
import { downloadPrescriptionPDF } from '@/features/receptionist/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Phone, MapPin, Calendar, Weight, Ruler, Droplets, User, FileText, Download, Search } from 'lucide-react';

export default function RecPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: patient, isLoading } = useRecPatient(id);
  const [rxPage, setRxPage] = useState(1);
  const [rxSearch, setRxSearch] = useState('');
  const perPage = 10;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!patient) return <div className="text-center py-12 text-muted-foreground">Patient not found</div>;

  const prescriptions = patient.prescriptions || [];
  const filteredRx = prescriptions.filter((rx: any) => {
    if (!rxSearch) return true;
    const q = rxSearch.toLowerCase();
    return (
      rx.prescriptionNo?.toLowerCase().includes(q) ||
      rx.diagnosis?.toLowerCase().includes(q) ||
      rx.medicines?.some((m: any) => m.name?.toLowerCase().includes(q))
    );
  });
  const totalRxPages = Math.ceil(filteredRx.length / perPage);
  const safePage = Math.min(rxPage, totalRxPages || 1);
  const paginatedRx = filteredRx.slice((safePage - 1) * perPage, safePage * perPage);

  const infoCards = [
    { icon: Calendar, label: 'Age', value: `${patient.age} years` },
    { icon: Droplets, label: 'Blood Group', value: patient.bloodGroup?.replace('_', ' ') || '-' },
    { icon: Weight, label: 'Weight', value: patient.weight ? `${patient.weight} kg` : '-' },
    { icon: Ruler, label: 'Height', value: patient.height ? `${patient.height} cm` : '-' },
    { icon: Phone, label: 'Phone', value: patient.phone || '-' },
    { icon: MapPin, label: 'Address', value: patient.address || '-' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/receptionist/patients')} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary shadow-glow flex items-center justify-center text-white font-bold text-lg">
                {patient.fullName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.fullName}</h1>
                <p className="text-sm text-muted-foreground font-mono">{patient.patientId}</p>
              </div>
            </div>
          </div>
        </div>
        <Link href={`/dashboard/receptionist/patients/${patient.id}/edit`}>
          <Button variant="outline" className="h-10 rounded-xl">
            <Pencil className="h-4 w-4 mr-2" /> Edit Patient
          </Button>
        </Link>
      </div>

      {/* Info Grid */}
      <Card className="premium-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Patient Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {infoCards.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card className="premium-card">
        <CardHeader><CardTitle className="text-base">Medical History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {patient.medicalHistory ? (
            <div>
              <p className="text-xs text-muted-foreground mb-1">History</p>
              <p className="text-sm">{patient.medicalHistory}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No medical history recorded</p>
          )}
          {patient.allergies && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Allergies</p>
              <Badge variant="destructive" className="rounded-lg">{patient.allergies}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <Card className="premium-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base shrink-0">
            Prescription History
            <span className="text-sm font-normal text-muted-foreground ml-2">({filteredRx.length})</span>
          </CardTitle>
          <div className="relative max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Rx, diagnosis..."
              value={rxSearch}
              onChange={(e) => { setRxSearch(e.target.value); setRxPage(1); }}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRx.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {rxSearch ? 'No matching prescriptions' : 'No prescriptions yet'}
              </p>
              <p className="text-xs text-muted-foreground">
                {rxSearch ? 'Try a different search term' : 'Prescriptions will appear here once created'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Rx No</th>
                      <th>Date</th>
                      <th>Diagnosis</th>
                      <th>Medicines</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRx.map((rx: any) => (
                      <tr key={rx.id}>
                        <td className="font-mono text-xs text-muted-foreground">{rx.prescriptionNo}</td>
                        <td className="whitespace-nowrap">{new Date(rx.createdAt).toLocaleDateString()}</td>
                        <td className="max-w-[200px] truncate">{rx.diagnosis || '-'}</td>
                        <td>
                          <span className="badge-gradient-blue">{rx.medicines?.length || 0} items</span>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/dashboard/receptionist/prescriptions/${rx.id}`}>
                              <Button variant="ghost" size="icon" className="rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => downloadPrescriptionPDF(rx.id)} className="rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                              <Download className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
                <Pagination page={safePage} totalPages={totalRxPages} total={filteredRx.length} onPageChange={setRxPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
