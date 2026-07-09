import { PrescriptionTemplateProps } from '../types';
import { getDocName, getDocLogoUrl, getSignatureUrl, getForm, fmtDur, formatFollowUp } from '../lib/helpers';

export function DefaultTemplate({ prescription, qrDataUrl, blankPrint }: PrescriptionTemplateProps) {
  const rx = prescription;
  const docName = getDocName(rx.doctor);
  const docLogo = getDocLogoUrl(rx.doctor);

  return (
    <div
      data-blank-print={blankPrint}
      className="bg-white"
      style={{ width: '210mm', margin: '0 auto', boxSizing: 'border-box' }}
    >
      {/* Letterhead */}
      <div className="letterhead p-6 border-b-4 border-black grid grid-cols-2 items-start">
        <div>
          <p className="text-2xl font-extrabold text-black">{docName}</p>
          {(rx.doctor?.degree || []).length > 0 && <p className="text-sm font-bold text-black">{(rx.doctor?.degree || []).join(', ')}</p>}
          {(rx.doctor?.specialization || []).length > 0 && <p className="text-sm font-semibold text-black tracking-wide">{(rx.doctor?.specialization || []).join(', ')}</p>}
          {rx.doctor?.clinicName && <p className="text-sm text-black">{rx.doctor.clinicName}</p>}
          {rx.doctor?.bmdcRegNo && <p className="text-sm text-black">BMDC: {rx.doctor.bmdcRegNo}</p>}
        </div>
        <div className="text-right">
          {docLogo ? (
            <img src={docLogo} alt="" className="w-12 h-12 object-contain ml-auto mb-1" />
          ) : (
            <div className="w-10 h-10 bg-black rounded ml-auto mb-1 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">RX</span>
            </div>
          )}
          <p className="text-[8px] font-bold text-black">Forwarded by PRESMANAGE</p>
          <p className="text-[10px] font-semibold text-black mt-1">Rx: {rx.prescriptionNo}</p>
          <p className="text-[10px] font-semibold text-black">{new Date(rx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          {rx.updatedAt && rx.updatedAt !== rx.createdAt && <p className="text-[9px] font-semibold text-black">Last update: {new Date(rx.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="px-10 py-6 grid grid-cols-[4fr_8fr] gap-6 text-[12px]">
        {/* Left Column */}
        <div className="border-r border-black pr-5 space-y-5">
          <div>
            <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">PATIENT DETAILS</p>
            <p className="text-[16px] font-bold text-black">{rx.patient?.fullName || ''}</p>
            <p className="text-[13px] text-black">Age: {rx.patient?.age || ''}Y | Sex: {(rx.patient?.gender || '')?.charAt(0) || ''} | Wt: {rx.patient?.weight || '—'}kg</p>
          </div>
          {(rx.bloodPressure || rx.pulseRate) && (
            <div>
              <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">VITALS</p>
              <p className="text-[13px] text-black">BP: {rx.bloodPressure || '—'} mmHg</p>
              <p className="text-[13px] text-black">HR: {rx.pulseRate || '—'} bpm</p>
            </div>
          )}
          <div>
            <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">CHIEF COMPLAINT</p>
            {rx.chiefComplaint ? rx.chiefComplaint.split('\n').filter(Boolean).map((item, i) => (
              <p key={i} className="text-[13px] text-black">• {item}</p>
            )) : <p className="text-[13px] text-black">—</p>}
          </div>
          {rx.symptoms && (
            <div>
              <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">SYMPTOMS</p>
              <p className="text-[13px] text-black">{rx.symptoms}</p>
            </div>
          )}
          {rx.diagnosis && (
            <div>
              <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">DIAGNOSIS</p>
              <p className="text-[13px] text-black">{rx.diagnosis}</p>
            </div>
          )}
          {qrDataUrl && (
            <div className="pt-4">
              <img src={qrDataUrl} alt="QR" className="w-[72px] h-[72px] block mb-1" />
              <p className="text-[10px] font-bold text-black">Scan for e-validation</p>
              {blankPrint && (
                <div className="pt-2 border-t border-black space-y-0.5 text-[10px] font-semibold text-black">
                  <p>Rx: {rx.prescriptionNo}</p>
                  <p>{new Date(rx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  {rx.doctor?.bmdcRegNo && <p>BMDC: {rx.doctor.bmdcRegNo}</p>}
                </div>
              )}
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
                    <p className="text-[14px] font-extrabold text-black">{prefix} {m.name}{m.strength ? ` ${m.strength}` : ''}{m.genericName ? <span className="font-normal text-black"> ({m.genericName})</span> : ''}</p>
                    <p className="text-[13px] font-semibold text-black ml-8">{m.dosage || '—'} · {m.frequency || '—'} · {fmtDur(m.duration)}</p>
                    {m.instructions && <p className="text-[11px] font-semibold text-black ml-8">{m.instructions}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] font-semibold text-black">No medicines prescribed</p>
          )}

          {rx.investigations?.filter((i: any) => i.name).length > 0 && (
            <div className="mt-6">
              <p className="text-[12px] font-extrabold text-black uppercase tracking-wider border-b-2 border-black pb-1 mb-2">INVESTIGATIONS</p>
              {rx.investigations.filter((i: any) => i.name).map((i: any, idx: number) => (
                <p key={idx} className="text-[14px] text-black">• {i.name}</p>
              ))}
            </div>
          )}

          {rx.advice && (
            <div className="mt-6">
              <p className="text-[12px] font-extrabold text-black uppercase tracking-wider border-b-2 border-black pb-1 mb-2">ADVICE</p>
              <p className="text-[12px] font-semibold text-black">{rx.advice}</p>
            </div>
          )}

          {rx.foodAdvice && (
            <div className="mt-6">
              <p className="text-[12px] font-extrabold text-black uppercase tracking-wider border-b-2 border-black pb-1 mb-2">FOOD ADVICE</p>
              <p className="text-[12px] font-semibold text-black">{rx.foodAdvice}</p>
            </div>
          )}

          {rx.followUpDate && (
            <div className="mt-6">
              <p className="text-[12px] font-semibold text-black"><span className="font-bold text-base">Follow-up:</span> {formatFollowUp(rx.followUpDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Signature */}
      <div className="signature text-right px-6 pb-6">
        {rx.doctor?.signatureImg ? (
          <img src={getSignatureUrl(rx.doctor)} alt="Signature" className="h-10 ml-auto mb-1 object-contain" />
        ) : (
          <div className="w-40 h-px bg-black ml-auto mb-2" />
        )}
        <p className="text-[12px] font-extrabold text-black uppercase">{docName}</p>
        {rx.doctor?.bmdcRegNo && <p className="text-[10px] font-semibold text-black">Reg No: {rx.doctor.bmdcRegNo}</p>}
      </div>
    </div>
  );
}
