'use client';

import { useParams } from 'next/navigation';
import { useDoctorPrescriptionById } from '@/features/mr/hooks';
import { PrescriptionView } from '@/components/prescription/prescription-view';

export default function PrescriptionDetailPage() {
  const { id: doctorId, prescriptionId } = useParams<{ id: string; prescriptionId: string }>();
  const { data: rx, isLoading } = useDoctorPrescriptionById(doctorId, prescriptionId);

  return (
    <PrescriptionView
      isLoading={isLoading}
      prescription={rx}
      backUrl={`/dashboard/mr/doctors/${doctorId}/prescriptions`}
      prescriptionId={prescriptionId}
    />
  );
}
