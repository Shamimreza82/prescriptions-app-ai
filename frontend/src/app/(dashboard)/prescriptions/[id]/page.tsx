'use client';

import { useParams } from 'next/navigation';
import { usePrescription } from '@/features/prescriptions/hooks';
import { PrescriptionView } from '@/components/prescription/prescription-view';

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: rx, isLoading } = usePrescription(id);

  return (
    <PrescriptionView
      isLoading={isLoading}
      prescription={rx}
      backUrl="/prescriptions"
      prescriptionId={id}
      showActions={{ new: true, edit: true }}
    />
  );
}
