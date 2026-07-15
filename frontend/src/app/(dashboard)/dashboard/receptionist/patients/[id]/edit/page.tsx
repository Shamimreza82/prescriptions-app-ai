'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRecPatient } from '@/features/receptionist/hooks';
import { PatientForm } from '@/features/patients/components/PatientForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RecEditPatientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: patient, isLoading } = useRecPatient(id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!patient) return <div className="text-center py-12 text-muted-foreground">Patient not found</div>;

  const defaultValues = {
    fullName: patient.fullName,
    age: patient.age,
    gender: patient.gender as any,
    bloodGroup: patient.bloodGroup as any,
    weight: patient.weight,
    height: patient.height,
    phone: patient.phone,
    address: patient.address,
    medicalHistory: patient.medicalHistory,
    allergies: patient.allergies,
    previousDiseases: patient.previousDiseases,
    emergencyContact: patient.emergencyContact,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/receptionist/patients">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Patient</h1>
          <p className="text-sm text-muted-foreground">{patient.patientId} &middot; {patient.fullName}</p>
        </div>
      </div>
      <PatientForm
        mode="receptionist"
        defaultValues={defaultValues}
        patientId={id}
        onSuccess={() => router.push('/dashboard/receptionist/patients')}
      />
    </div>
  );
}
