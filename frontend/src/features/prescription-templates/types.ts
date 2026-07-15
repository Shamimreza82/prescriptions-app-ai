import { Prescription } from '@/features/prescriptions/types';
import { ComponentType } from 'react';

export interface PrescriptionOptions {
  showQRCode: boolean;
  showSignature: boolean;
  showLetterhead: boolean;
  showFooter: boolean;
  showPatientContact: boolean;
  showVitals: boolean;
  showDiagnosis: boolean;
  showGenericName: boolean;
  showInvestigations: boolean;
  showAdvice: boolean;
  showFoodAdvice: boolean;
  fontSize: 'small' | 'medium' | 'large';
  dosageFormat: 'numeric' | 'text';
  compactMode: boolean;
  grayscaleMode: boolean;
  prescriptionTypeLabel: 'none' | 'original' | 'duplicate' | 'copy';
  draftWatermark: boolean;
  disclaimerText: string;
  medicineSortBy: 'default' | 'name' | 'form';
}

export const defaultOptions: PrescriptionOptions = {
  showQRCode: true,
  showSignature: true,
  showLetterhead: true,
  showFooter: true,
  showPatientContact: false,
  showVitals: true,
  showDiagnosis: true,
  showGenericName: true,
  showInvestigations: true,
  showAdvice: true,
  showFoodAdvice: true,
  fontSize: 'medium',
  dosageFormat: 'numeric',
  compactMode: false,
  grayscaleMode: false,
  prescriptionTypeLabel: 'none',
  draftWatermark: false,
  disclaimerText: '',
  medicineSortBy: 'default',
};

export interface PrescriptionTemplateProps {
  prescription: Prescription;
  qrDataUrl: string;
  blankPrint?: boolean;
  options?: PrescriptionOptions;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  component: ComponentType<PrescriptionTemplateProps>;
}
