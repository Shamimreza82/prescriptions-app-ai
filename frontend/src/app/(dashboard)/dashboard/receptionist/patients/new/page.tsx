'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PatientForm } from '@/features/patients/components/PatientForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RecNewPatientPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/receptionist/patients">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Add New Patient</h1>
      </div>
      <PatientForm mode="receptionist" onSuccess={() => router.push('/dashboard/receptionist/patients')} />
    </div>
  );
}
