'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePrescription } from '@/features/prescriptions/hooks';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

const formAbbr: Record<string, string> = {
  'Tablet': 'TAB.', 'Capsule': 'CAP.', 'Injection': 'INJ.', 'Inject': 'INJ.',
  'Syrup': 'SYP.', 'Cream': 'CRM.', 'Ointment': 'OINT.', 'Gel': 'GEL.',
  'Drop': 'DROP.', 'Inhaler': 'INH.', 'Suspension': 'SUSP.', 'Solution': 'SOLN.',
  'Lotion': 'LOT.', 'Spray': 'SPRAY.', 'Powder': 'PDR.', 'Sachet': 'SACH.',
};
const getForm = (f?: string) => (f ? formAbbr[f] || f.toUpperCase() + '.' : '');
const fmtDur = (d?: string) => (d ? (/day/i.test(d) ? d : `${d} Days`) : '—');

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: rx, isLoading } = usePrescription(id);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    QRCodeLib.toDataURL(`${apiBase}/verify`, { width: 72, margin: 1, color: { dark: '#000', light: '#fff' } })
      .then(setQrDataUrl).catch(() => {});
  }, []);

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}</div>;
  if (!rx) return <div className="text-center py-12 text-muted-foreground">Prescription not found</div>;

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const docName = rx.doctor?.fullName ? `Dr. ${rx.doctor.fullName}` : 'Dr. Doctor';
  const docLogo = rx.doctor?.clinicLogo ? `${apiBase}/uploads/${rx.doctor.clinicLogo}` : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print { body * { visibility: hidden; } #print-content, #print-content * { visibility: visible; } #print-content { position: absolute; top: 0; left: 0; width: 100%; border: none !important; box-shadow: none !important; border-radius: 0 !important; } }
      `}</style>
      <div className="flex items-center justify-between">
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
            <Link href="/prescriptions/new">
              <Plus className="h-4 w-4 mr-2" />New
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/prescriptions/${rx.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
        </div>
      </div>

      {/* ===== Prescription Preview ===== */}
      <div id="print-content" className="bg-white border shadow-sm" style={{ width: '210mm', margin: '0 auto' }}>
        {/* Letterhead */}
        <div className="p-6 border-b-4 border-black flex justify-between items-start">
          <div>
            <p className="text-lg font-extrabold text-black">{docName}</p>
            {(rx.doctor?.degree || []).length > 0 && <p className="text-xs font-bold text-black">{(rx.doctor?.degree || []).join(', ')}</p>}
            {(rx.doctor?.specialization || []).length > 0 && <p className="text-[10px] font-semibold text-black uppercase tracking-wide">{(rx.doctor?.specialization || []).join(', ')}</p>}
            {rx.doctor?.clinicName && <p className="text-[10px] font-semibold text-black">{rx.doctor.clinicName}</p>}
            {rx.doctor?.clinicAddress && <p className="text-[10px] font-semibold text-black">{rx.doctor.clinicAddress}</p>}
            {rx.doctor?.bmdcRegNo && <p className="text-[10px] font-semibold text-black">BMDC: {rx.doctor.bmdcRegNo}</p>}
            {rx.doctor?.phone && <p className="text-[10px] font-semibold text-black">{rx.doctor.phone}</p>}
          </div>
          <div className="text-right">
            {docLogo ? (
              <img src={docLogo} alt="" className="w-12 h-12 object-contain ml-auto mb-1" />
            ) : (
              <div className="w-10 h-10 bg-black rounded ml-auto mb-1 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">RX</span>
              </div>
            )}
            <p className="text-[7px] font-bold text-black">Forwarded by PRESMANAGE</p>
            <p className="text-[9px] font-semibold text-black mt-1">Rx: {rx.prescriptionNo}</p>
            <p className="text-[9px] font-semibold text-black">{new Date(rx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            {rx.updatedAt && rx.updatedAt !== rx.createdAt && <p className="text-[8px] font-semibold text-black">Last update: {new Date(rx.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-[4fr_8fr] gap-6 text-[11px]">
          {/* Left Column */}
          <div className="border-r border-black pr-5 space-y-5">
            <div>
              <p className="text-[9px] font-extrabold text-black uppercase tracking-widest mb-1">PATIENT DETAILS</p>
              <p className="text-[11px] font-bold text-black">{rx.patient?.fullName || ''}</p>
              <p className="text-[11px] font-semibold text-black">Age: {rx.patient?.age || ''}Y | Sex: {(rx.patient?.gender || '')?.charAt(0) || ''}</p>
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-black uppercase tracking-widest mb-1">SYMPTOMS</p>
              <p className="text-[11px] font-semibold text-black">{rx.symptoms || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-black uppercase tracking-widest mb-1">VITALS</p>
              <p className="text-[11px] font-semibold text-black">BP: {rx.bloodPressure || '—'} mmHg</p>
              <p className="text-[11px] font-semibold text-black">HR: {rx.pulseRate || '—'} bpm</p>
            </div>
            {rx.diagnosis && (
              <div>
                <p className="text-[9px] font-extrabold text-black uppercase tracking-widest mb-1">DIAGNOSIS</p>
                <p className="text-[11px] font-semibold text-black">{rx.diagnosis}</p>
              </div>
            )}
            {qrDataUrl && (
              <div className="pt-4">
                <img src={qrDataUrl} alt="QR" className="w-[72px] h-[72px] block mb-1" />
                <p className="text-[9px] font-bold text-black">Scan for e-validation</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl italic font-bold text-black font-serif">Rx</span>
              <div className="h-px flex-1 bg-black" />
            </div>

            {rx.medicines?.filter((m: any) => m.name).length > 0 ? (
              <div>
                {rx.medicines.filter((m: any) => m.name).map((m: any, i: number) => {
                  const prefix = getForm(m.form);
                  return (
                    <div key={i} className="mb-3 pb-2 border-b border-dashed border-gray-400 last:border-0">
                      <p className="text-[13px] font-extrabold text-black">{prefix} {m.name}{m.strength ? ` ${m.strength}` : ''}</p>
                      <p className="text-[12px] font-semibold text-black ml-8">{m.dosage || '—'} · {m.frequency || '—'} · {fmtDur(m.duration)}</p>
                      {m.instructions && <p className="text-[10px] font-semibold text-black ml-8">{m.instructions}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-black">No medicines prescribed</p>
            )}

            {rx.investigations?.filter((i: any) => i.name).length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] font-extrabold text-black uppercase tracking-wider border-b-2 border-black pb-1 mb-2">INVESTIGATIONS</p>
                <p className="text-[11px] font-semibold text-black">{rx.investigations.filter((i: any) => i.name).map((i: any) => i.name).join(', ')}</p>
              </div>
            )}

            {rx.advice && (
              <div className="mt-6">
                <p className="text-[11px] font-extrabold text-black uppercase tracking-wider border-b-2 border-black pb-1 mb-2">ADVICE</p>
                <p className="text-[11px] font-semibold text-black">{rx.advice}</p>
              </div>
            )}

            {rx.foodAdvice && (
              <div className="mt-6">
                <p className="text-[11px] font-extrabold text-black uppercase tracking-wider border-b-2 border-black pb-1 mb-2">FOOD ADVICE</p>
                <p className="text-[11px] font-semibold text-black">{rx.foodAdvice}</p>
              </div>
            )}

            {rx.followUpDate && (
              <div className="mt-6">
                <p className="text-[11px] font-extrabold text-black uppercase tracking-wider border-b-2 border-black pb-1 mb-2">FOLLOW-UP</p>
                <p className="text-[11px] font-semibold text-black">{new Date(rx.followUpDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature */}
        <div className="text-right px-6 pb-6">
          {rx.doctor?.signatureImg ? (
            <img src={`${apiBase}/uploads/${rx.doctor.signatureImg}`} alt="Signature" className="h-10 ml-auto mb-1 object-contain" />
          ) : (
            <div className="w-40 h-px bg-black ml-auto mb-2" />
          )}
          <p className="text-[11px] font-extrabold text-black uppercase">{docName}</p>
          {rx.doctor?.bmdcRegNo && <p className="text-[9px] font-semibold text-black">Reg No: {rx.doctor.bmdcRegNo}</p>}
        </div>
      </div>
    </div>
  );
}
