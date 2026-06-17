'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePrescription } from '@/features/prescriptions/hooks';
import { downloadPrescriptionPDF, printPrescriptionPDF } from '@/features/prescriptions/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Printer, Pencil } from 'lucide-react';

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: rx, isLoading } = usePrescription(id);

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}</div>;
  if (!rx) return <div className="text-center py-12 text-muted-foreground">Prescription not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/prescriptions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Prescription #{rx.prescriptionNo}</h1>
            <p className="text-muted-foreground">{new Date(rx.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/prescriptions/${rx.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={() => downloadPrescriptionPDF(rx.id)}>
            <Download className="h-4 w-4 mr-2" />PDF
          </Button>
          <Button onClick={() => printPrescriptionPDF(rx.id)}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 border rounded-lg p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{rx.doctor?.clinicName || 'Clinic'}</h2>
            <p className="text-sm text-muted-foreground">{rx.doctor?.clinicAddress}</p>
            <p className="text-sm text-muted-foreground">Phone: {rx.doctor?.phone}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Rx: {rx.prescriptionNo}</p>
            <p>Date: {new Date(rx.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <hr />
        <p className="font-semibold">Dr. {rx.doctor?.fullName}</p>
        <p className="text-sm text-muted-foreground">{rx.doctor?.degree} | BMDC: {rx.doctor?.bmdcRegNo}</p>
        <hr />

        <div className="grid grid-cols-2 gap-4">
          <p className="text-sm text-muted-foreground">Patient: <span className="font-medium text-foreground">{rx.patient?.fullName}</span> (ID: {rx.patient?.patientId})</p>
          <p className="text-sm text-muted-foreground">Age: {rx.patient?.age} | Gender: {rx.patient?.gender}</p>
        </div>

        {(rx.bloodPressure || rx.pulseRate) && (
          <div className="flex gap-6 text-sm">
            {rx.bloodPressure && <div><span className="text-muted-foreground">BP:</span> <span className="font-medium">{rx.bloodPressure}</span></div>}
            {rx.pulseRate && <div><span className="text-muted-foreground">Pulse:</span> <span className="font-medium">{rx.pulseRate}</span></div>}
            {rx.temperature && <div><span className="text-muted-foreground">Temp:</span> <span className="font-medium">{rx.temperature}</span></div>}
            {rx.oxygenSaturation && <div><span className="text-muted-foreground">SpO2:</span> <span className="font-medium">{rx.oxygenSaturation}</span></div>}
          </div>
        )}

        {rx.chiefComplaint && <div><h3 className="font-semibold mb-1">Chief Complaint</h3><p className="text-sm">{rx.chiefComplaint}</p></div>}
        {rx.diagnosis && <div><h3 className="font-semibold mb-1">Diagnosis</h3><p className="text-sm">{rx.diagnosis}</p></div>}

        {rx.medicines?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Medicines</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rx.medicines.map((m: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{m.name} {m.strength ? `(${m.strength})` : ''}</TableCell>
                    <TableCell>{m.dosage}</TableCell>
                    <TableCell>{m.frequency}</TableCell>
                    <TableCell>{m.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rx.advice && <div><h3 className="font-semibold mb-1">Advice</h3><p className="text-sm">{rx.advice}</p></div>}
        {rx.followUpDate && <div><h3 className="font-semibold text-red-600">Follow-up: {new Date(rx.followUpDate).toLocaleDateString()}</h3></div>}

        <div className="text-right pt-4">
          <p className="font-semibold">Dr. {rx.doctor?.fullName}</p>
          <p className="text-sm text-muted-foreground">{rx.doctor?.degree}</p>
        </div>
      </div>
    </div>
  );
}
