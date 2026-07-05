import { Prescription } from '@/features/prescriptions/types';
import { ComponentType } from 'react';

export interface PrescriptionTemplateProps {
  prescription: Prescription;
  qrDataUrl: string;
  blankPrint?: boolean;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  component: ComponentType<PrescriptionTemplateProps>;
}
