import { PrescriptionTemplateProps, defaultOptions } from '../types';
import { getDocName, getDocLogoUrl, getSignatureUrl, getForm, fmtDur, formatFollowUp, formatDosage } from '../lib/helpers';
import { cn } from '@/lib/utils';

export function DefaultTemplate({ prescription, qrDataUrl, blankPrint, options }: PrescriptionTemplateProps) {
  const rx = prescription;
  const docName = getDocName(rx.doctor);
  const docLogo = getDocLogoUrl(rx.doctor);
  const opts = options || defaultOptions;

  const fontSizeClass = {
    small: 'text-[10px]',
    medium: 'text-[12px]',
    large: 'text-[14px]',
  }[opts.fontSize];

  const sortedMedicines = [...(rx.medicines || [])].filter((m: any) => m.name);
  if (opts.medicineSortBy === 'name') {
    sortedMedicines.sort((a: any, b: any) => a.name.localeCompare(b.name));
  } else if (opts.medicineSortBy === 'form') {
    sortedMedicines.sort((a: any, b: any) => (a.form || '').localeCompare(b.form || ''));
  }

  return (
    <div
      data-blank-print={blankPrint}
      className={cn(
        'bg-white flex flex-col',
        opts.grayscaleMode && 'grayscale',
        opts.compactMode && 'space-y-0'
      )}
      style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}
    >
      {opts.draftWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.08] z-10">
          <span className="text-[80px] font-extrabold text-black rotate-[-30deg]">DRAFT</span>
        </div>
      )}

      {opts.prescriptionTypeLabel !== 'none' && (
        <div className="absolute top-8 right-8 z-10">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-2',
            opts.prescriptionTypeLabel === 'original' ? 'text-green-700 border-green-700' :
            opts.prescriptionTypeLabel === 'duplicate' ? 'text-amber-700 border-amber-700' :
            'text-gray-500 border-gray-500'
          )}>
            {opts.prescriptionTypeLabel}
          </span>
        </div>
      )}

      {/* Letterhead */}
      {opts.showLetterhead && (
        <div className="letterhead p-6 border-b-2 border-black grid grid-cols-2 items-start">
          <div>
            <p className={cn('font-extrabold text-black', opts.fontSize === 'large' ? 'text-3xl' : opts.fontSize === 'small' ? 'text-xl' : 'text-2xl')}>{docName}</p>
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
            <p className="text-[8px] font-bold text-black">Forwarded by MEDICLOUD</p>
            <p className="text-[10px] font-semibold text-black mt-1">Rx: {rx.prescriptionNo}</p>
            <p className="text-[10px] font-semibold text-black">{new Date(rx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            {rx.updatedAt && rx.updatedAt !== rx.createdAt && <p className="text-[9px] font-semibold text-black">Last update: {new Date(rx.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>}
          </div>
        </div>
      )}

      {/* Body */}
      <div className={cn('flex flex-col flex-1', opts.compactMode && '!mt-0')}>
        <div className={cn('px-10 py-6 grid grid-cols-[4fr_8fr] gap-6 flex-1', opts.compactMode && 'px-6 py-3 gap-4')}>
          {/* Left Column */}
          <div className={cn('border-r border-black pr-5 space-y-5', opts.compactMode && 'pr-3 space-y-3')}>
            <div>
              <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">PATIENT DETAILS</p>
              <p className={cn('font-bold text-black', opts.fontSize === 'large' ? 'text-[18px]' : opts.fontSize === 'small' ? 'text-[14px]' : 'text-[16px]')}>{rx.patient?.fullName || ''}</p>
              <p className={cn('text-black', opts.fontSize === 'large' ? 'text-[15px]' : opts.fontSize === 'small' ? 'text-[11px]' : 'text-[13px]')}>Age: {rx.patient?.age || ''}Y | Sex: {(rx.patient?.gender || '')?.charAt(0) || ''} | Wt: {rx.patient?.weight || '—'}kg</p>
              {opts.showPatientContact && rx.patient?.phone && (
                <p className={cn('text-black', opts.fontSize === 'large' ? 'text-[13px]' : 'text-[11px]')}>Phone: {rx.patient.phone}{rx.patient?.address ? ` | ${rx.patient.address}` : ''}</p>
              )}
            </div>
            {(rx.bloodPressure || rx.pulseRate) && opts.showVitals && (
              <div>
                <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">VITALS</p>
                <p className={fontSizeClass}>BP: {rx.bloodPressure || '—'} mmHg</p>
                <p className={fontSizeClass}>HR: {rx.pulseRate || '—'} bpm</p>
              </div>
            )}
            <div>
              <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">CHIEF COMPLAINT</p>
              {rx.chiefComplaint ? rx.chiefComplaint.split('\n').filter(Boolean).map((item, i) => (
                <p key={i} className={fontSizeClass}>• {item}</p>
              )) : <p className={fontSizeClass}>—</p>}
            </div>
            {rx.symptoms && (
              <div>
                <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">SYMPTOMS</p>
                <p className={fontSizeClass}>{rx.symptoms}</p>
              </div>
            )}
            {rx.diagnosis && opts.showDiagnosis && (
              <div>
                <p className="text-[12px] font-extrabold text-black uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-1">DIAGNOSIS</p>
                <p className={fontSizeClass}>{rx.diagnosis}</p>
              </div>
            )}
            {qrDataUrl && opts.showQRCode && (
              <div className="pt-4">
                <div className="inline-block border border-gray-200 p-1.5 rounded">
                  <img src={qrDataUrl} alt="QR" className="w-24 h-24 block" />
                </div>
                <p className="text-[9px] font-semibold text-black mt-1">Scan for e-validation</p>
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
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl italic font-bold text-black font-serif">Rx</span>
              <div className="h-px flex-1 bg-black" />
            </div>

            {sortedMedicines.length > 0 ? (
              <div>
                {sortedMedicines.map((m: any, i: number) => {
                  const prefix = getForm(m.form);
                  return (
                    <div key={i} className={cn('mb-3 pb-2 border-b border-dashed border-gray-400 last:border-0', opts.compactMode && 'mb-1 pb-1')}>
                      <p className={cn('font-extrabold text-black', opts.fontSize === 'large' ? 'text-[16px]' : opts.fontSize === 'small' ? 'text-[12px]' : 'text-[14px]')}>
                        {prefix} {m.name}{m.strength ? ` ${m.strength}` : ''}{m.genericName && opts.showGenericName ? <span className="font-normal text-black"> ({m.genericName})</span> : ''}
                      </p>
                      <p className={cn('font-semibold text-black ml-8', opts.fontSize === 'large' ? 'text-[15px]' : opts.fontSize === 'small' ? 'text-[11px]' : 'text-[13px]')}>
                        {formatDosage(m.dosage, opts.dosageFormat) || '—'} · {m.frequency || '—'} · {fmtDur(m.duration)}
                      </p>
                      {m.instructions && <p className={cn('font-semibold text-black ml-8', opts.fontSize === 'large' ? 'text-[13px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[11px]')}>{m.instructions}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={fontSizeClass}>No medicines prescribed</p>
            )}

            {rx.investigations?.filter((i: any) => i.name).length > 0 && opts.showInvestigations && (
              <div className="mt-6">
                <p className="text-[12px] font-extrabold text-black uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">INVESTIGATIONS</p>
                {rx.investigations.filter((i: any) => i.name).map((i: any, idx: number) => (
                  <p key={idx} className={cn('text-black', opts.fontSize === 'large' ? 'text-[16px]' : opts.fontSize === 'small' ? 'text-[12px]' : 'text-[14px]')}>• {i.name}</p>
                ))}
              </div>
            )}

            {rx.advice && opts.showAdvice && (
              <div className="mt-6">
                <p className="text-[12px] font-extrabold text-black uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">ADVICE</p>
                <p className={cn('text-black break-words whitespace-pre-wrap', fontSizeClass)}>{rx.advice}</p>
              </div>
            )}

            {rx.foodAdvice && opts.showFoodAdvice && (
              <div className="mt-6">
                <p className="text-[12px] font-extrabold text-black uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">FOOD ADVICE</p>
                <p className={cn('text-black break-words whitespace-pre-wrap', fontSizeClass)}>{rx.foodAdvice}</p>
              </div>
            )}

            {rx.followUpDate && (
              <div className="mt-6">
                <p className={cn('font-semibold text-black', fontSizeClass)}><span className="font-bold text-base">Follow-up:</span> {formatFollowUp(rx.followUpDate)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature */}
        {opts.showSignature && (
          <div className="signature text-right px-6 pb-6">
            {rx.doctor?.signatureImg ? (
              <img src={getSignatureUrl(rx.doctor)} alt="Signature" className="h-10 ml-auto mb-1 object-contain" />
            ) : (
              <div className="w-40 h-px bg-black ml-auto mb-2" />
            )}
            <p className={cn('font-extrabold text-black uppercase', opts.fontSize === 'large' ? 'text-[14px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[12px]')}>{docName}</p>
            {rx.doctor?.bmdcRegNo && <p className={cn('font-semibold text-black', opts.fontSize === 'large' ? 'text-[12px]' : opts.fontSize === 'small' ? 'text-[9px]' : 'text-[10px]')}>Reg No: {rx.doctor.bmdcRegNo}</p>}
          </div>
        )}

        {opts.disclaimerText && (
          <div className="px-6 pb-2">
            <p className={cn('text-gray-500 italic', opts.fontSize === 'large' ? 'text-[10px]' : opts.fontSize === 'small' ? 'text-[7px]' : 'text-[9px]')}>{opts.disclaimerText}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!blankPrint && opts.showFooter && <div className="footer px-6 pb-4">
        <div className="border-t border-gray-300 pt-3 flex items-center justify-between text-[9px] text-gray-500">
          <div className="space-y-0.5">
            {rx.doctor?.clinicAddress && <p>{rx.doctor.clinicAddress}</p>}
            {rx.doctor?.phone && <p>Phone: {rx.doctor.phone}</p>}
            {rx.doctor?.user?.email && <p>Email: {rx.doctor.user.email}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold text-black">MEDICLOUD</p>
            <p>Digitally Generated Prescription</p>
          </div>
        </div>
      </div>}
    </div>
  );
}