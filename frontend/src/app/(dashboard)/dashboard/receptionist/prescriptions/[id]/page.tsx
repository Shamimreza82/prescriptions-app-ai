'use client';

import { useParams } from 'next/navigation';
import { useRecPrescription } from '@/features/receptionist/hooks';
import { PrescriptionView } from '@/components/prescription/prescription-view';

export default function RecPrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: rx, isLoading } = useRecPrescription(id);

  return (
    <PrescriptionView
      isLoading={isLoading}
      prescription={rx}
      backUrl="/dashboard/receptionist/prescriptions"
      prescriptionId={id}
    />
  );
}
