import { formatFollowUp } from '@/lib/utils';

const formAbbr: Record<string, string> = {
  'Tablet': 'TAB.', 'Capsule': 'CAP.', 'Injection': 'INJ.', 'Inject': 'INJ.',
  'Syrup': 'SYP.', 'Cream': 'CRM.', 'Ointment': 'OINT.', 'Gel': 'GEL.',
  'Drop': 'DROP.', 'Inhaler': 'INH.', 'Suspension': 'SUSP.', 'Solution': 'SOLN.',
  'Lotion': 'LOT.', 'Spray': 'SPRAY.', 'Powder': 'PDR.', 'Sachet': 'SACH.',
};

export const getForm = (f?: string) => (f ? formAbbr[f] || f.toUpperCase() + '.' : '');

export const fmtDur = (d?: string) => (d ? (/day/i.test(d) ? d : `${d} Days`) : '—');

export const getApiBase = () => process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const getDocName = (doctor?: any) =>
  doctor?.fullName ? `Dr. ${doctor.fullName}` : 'Dr. Doctor';

export const getDocLogoUrl = (doctor?: any) =>
  doctor?.clinicLogo ? `${getApiBase()}/uploads/${doctor.clinicLogo}` : '';

export const getSignatureUrl = (doctor?: any) =>
  doctor?.signatureImg ? `${getApiBase()}/uploads/${doctor.signatureImg}` : '';

export { formatFollowUp };
