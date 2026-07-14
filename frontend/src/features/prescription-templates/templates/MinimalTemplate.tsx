import { PrescriptionTemplateProps } from '../types';
import { getDocName, getDocLogoUrl, getSignatureUrl, getForm, fmtDur, formatFollowUp } from '../lib/helpers';

export function MinimalTemplate({ prescription, qrDataUrl, blankPrint }: PrescriptionTemplateProps) {
  const rx = prescription;
  const docName = getDocName(rx.doctor);
  const docLogo = getDocLogoUrl(rx.doctor);

  return (
    <div
      data-blank-print={blankPrint}
      className="bg-white flex flex-col"
      style={{ width: '210mm', margin: '0 auto', minHeight: '297mm' }}
    >
      {/* Header */}
      <div className="letterhead px-8 pt-8 pb-4 border-b border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{docName}</h1>
            <p className="text-sm text-gray-700 mt-0.5">{(rx.doctor?.degree || []).join(', ')}</p>
            {(rx.doctor?.specialization || []).length > 0 && (
              <p className="text-sm text-gray-600 mt-0.5">{(rx.doctor.specialization || []).join(', ')}</p>
            )}
            <div className="mt-1 text-sm text-gray-600 space-y-0.5">
              {rx.doctor?.clinicName && <p>{rx.doctor.clinicName}</p>}
              {rx.doctor?.bmdcRegNo && <p>BMDC: {rx.doctor.bmdcRegNo}</p>}
            </div>
          </div>
          <div className="text-right">
            {docLogo ? (
              <img src={docLogo} alt="" className="w-10 h-10 object-contain ml-auto mb-1" />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded-full ml-auto mb-1 flex items-center justify-center">
                <span className="text-gray-500 text-[10px] font-bold">RX</span>
              </div>
            )}
            <p className="text-[8px] text-gray-400">Forwarded by MEDICLOUD</p>
          </div>
        </div>
      </div>

      {/* Body + Signature wrapper */}
      <div className="flex flex-col flex-1">

      {/* Meta */}
      <div className="px-8 py-3 border-b border-gray-100 flex justify-between text-[9px] text-gray-500">
        <span>Rx: {rx.prescriptionNo}</span>
        <span>{new Date(rx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {/* Body */}
      <div className="p-8 grid grid-cols-[3fr_9fr] gap-8 text-[11px]">
        {/* Left Column */}
        <div className="space-y-4">
          {rx.patient && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Patient</p>
              <p className="font-bold text-gray-900 text-[13px]">{rx.patient.fullName}</p>
              <p className="text-gray-600">{rx.patient.age}Y · {rx.patient.gender?.charAt(0)} · {rx.patient.weight || '—'}kg</p>
            </div>
          )}
          <div>
            <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Chief Complaint</p>
            {(rx.chiefComplaint || '').split('\n').filter(Boolean).map((item, i) => (
              <p key={i} className="text-gray-700">• {item}</p>
            ))}
            {!rx.chiefComplaint && <p className="text-gray-400">—</p>}
          </div>
          {rx.symptoms && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Symptoms</p>
              <p className="text-gray-700">{rx.symptoms}</p>
            </div>
          )}
          {(rx.bloodPressure || rx.pulseRate || rx.temperature || rx.oxygenSaturation) && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Vitals</p>
              {rx.bloodPressure && <p className="text-gray-700">BP {rx.bloodPressure}</p>}
              {rx.pulseRate && <p className="text-gray-700">HR {rx.pulseRate}</p>}
              {rx.temperature && <p className="text-gray-700">Temp {rx.temperature}°F</p>}
              {rx.oxygenSaturation && <p className="text-gray-700">SpO₂ {rx.oxygenSaturation}%</p>}
            </div>
          )}
          {rx.diagnosis && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Diagnosis</p>
              <p className="text-gray-700">{rx.diagnosis}</p>
            </div>
          )}
          {qrDataUrl && (
            <div className="pt-2">
              <img src={qrDataUrl} alt="QR" className="w-20 h-20 mb-1" />
              <p className="text-[8px] font-semibold text-black">Scan for e-validation</p>
              {blankPrint && (
                <div className="pt-2 border-t border-gray-200 space-y-0.5 text-[8px] text-gray-500">
                  <p>Rx: {rx.prescriptionNo}</p>
                  <p>{new Date(rx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {rx.doctor?.bmdcRegNo && <p>BMDC: {rx.doctor.bmdcRegNo}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl italic font-bold text-gray-800 font-serif">Rx</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          {rx.medicines?.filter((m: any) => m.name).length > 0 ? (
            <div className="space-y-2">
              {rx.medicines.filter((m: any) => m.name).map((m: any, i: number) => {
                const prefix = getForm(m.form);
                return (
                  <div key={i} className="pb-2 border-b border-gray-100 last:border-0">
                    <p className="text-[12px] font-bold text-gray-900">{prefix} {m.name}{m.strength ? ` ${m.strength}` : ''}{m.genericName ? <span className="font-normal text-gray-500"> ({m.genericName})</span> : ''}</p>
                    <p className="text-[11px] text-gray-700 ml-5">{m.dosage || '—'} · {m.frequency || '—'} · {fmtDur(m.duration)}</p>
                    {m.instructions && <p className="text-[9px] text-gray-500 ml-5">{m.instructions}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400">No medicines prescribed</p>
          )}

          {rx.investigations?.filter((i: any) => i.name).length > 0 && (
            <div className="mt-5">
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Investigations</p>
              {rx.investigations.filter((i: any) => i.name).map((i: any, idx: number) => (
                <p key={idx} className="text-gray-700">• {i.name}</p>
              ))}
            </div>
          )}

          {rx.advice && (
            <div className="mt-5">
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Advice</p>
              <p className="text-[10px] text-gray-700 break-words whitespace-pre-wrap">{rx.advice}</p>
            </div>
          )}

          {rx.foodAdvice && (
            <div className="mt-5">
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Food Advice</p>
              <p className="text-[10px] text-gray-700 break-words whitespace-pre-wrap">{rx.foodAdvice}</p>
            </div>
          )}

          {rx.followUpDate && (
            <div className="mt-5">
              <p className="text-[11px] text-gray-700"><span className="font-bold">Follow-up:</span> {formatFollowUp(rx.followUpDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Signature */}
      <div className="signature px-8 pb-8 flex justify-end">
        <div className="text-right">
          {rx.doctor?.signatureImg ? (
            <img src={getSignatureUrl(rx.doctor)} alt="Signature" className="h-10 ml-auto mb-1 object-contain" />
          ) : (
            <div className="w-40 h-px bg-gray-400 ml-auto mb-2" />
          )}
          <p className="text-[11px] font-bold text-gray-900 uppercase">{docName}</p>
          {rx.doctor?.bmdcRegNo && <p className="text-[9px] text-gray-500">Reg No: {rx.doctor.bmdcRegNo}</p>}
        </div>
      </div>
      </div>

      {/* Footer */}
      {!blankPrint && <div className="footer px-8 pb-4">
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-[9px] text-gray-500">
          <div className="space-y-0.5">
            {rx.doctor?.clinicAddress && <p>{rx.doctor.clinicAddress}</p>}
            {rx.doctor?.phone && <p>Phone: {rx.doctor.phone}</p>}
            {rx.doctor?.user?.email && <p>Email: {rx.doctor.user.email}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">MEDICLOUD</p>
            <p>Digitally Generated Prescription</p>
          </div>
        </div>
      </div>}
    </div>
  );
}
