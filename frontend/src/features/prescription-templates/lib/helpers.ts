import { formatFollowUp } from '@/lib/utils';

const formAbbr: Record<string, string> = {
  'Tablet': 'TAB.', 'Capsule': 'CAP.', 'Injection': 'INJ.', 'Inject': 'INJ.',
  'Syrup': 'SYP.', 'Cream': 'CRM.', 'Ointment': 'OINT.', 'Gel': 'GEL.',
  'Drop': 'DROP.', 'Inhaler': 'INH.', 'Suspension': 'SUSP.', 'Solution': 'SOLN.',
  'Lotion': 'LOT.', 'Spray': 'SPRAY.', 'Powder': 'PDR.', 'Sachet': 'SACH.',
};

export const getForm = (f?: string) => (f ? formAbbr[f] || f.toUpperCase() + '.' : '');

export const fmtDur = (d?: string) => {
  if (!d) return '—';
  if (/continuous/i.test(d)) return d;
  if (/day/i.test(d)) return d;
  return `${d} Days`;
};

const dosageTextMap: Record<string, string> = {
  '1+0+0': 'Morning',
  '0+0+1': 'Night',
  '1+0+1': 'Morning + Night',
  '1+1+1': 'Morning + Noon + Night',
  '1+1+0': 'Morning + Noon',
  '0+1+1': 'Noon + Night',
  '½+0+½': '½ Morning + ½ Night',
  '½+0+0': '½ Morning',
  '0+0+½': '½ Night',
  '1+½+1': 'Morning + ½ Noon + Night',
  '½+½+½': '½ Morning + ½ Noon + ½ Night',
};

export const formatDosage = (dosage: string, format: 'numeric' | 'text'): string => {
  if (format === 'numeric' || !dosage) return dosage;
  return dosageTextMap[dosage] || dosage;
};

export const getApiBase = () => process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const getDocName = (doctor?: any) =>
  doctor?.fullName ? `Dr. ${doctor.fullName}` : 'Dr. Doctor';

export const getDocLogoUrl = (doctor?: any) =>
  doctor?.clinicLogo ? `${getApiBase()}/uploads/${doctor.clinicLogo}` : '';

export const getSignatureUrl = (doctor?: any) =>
  doctor?.signatureImg ? `${getApiBase()}/uploads/${doctor.signatureImg}` : '';

export { formatFollowUp };
