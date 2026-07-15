import { PrescriptionTemplateProps, defaultOptions } from '../types';
import { getDocName, getDocLogoUrl, getSignatureUrl, getForm, fmtDur, formatFollowUp, formatDosage } from '../lib/helpers';
import { cn } from '@/lib/utils';

export function MinimalTemplate({ prescription, qrDataUrl, blankPrint, options }: PrescriptionTemplateProps) {
  const rx = prescription;
  const docName = getDocName(rx.doctor);
  const docLogo = getDocLogoUrl(rx.doctor);
  const opts = options || defaultOptions;

  const fontSizeClass = {
    small: 'text-[10px]',
    medium: 'text-[11px]',
    large: 'text-[13px]',
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
        opts.grayscaleMode && 'grayscale'
      )}
      style={{ width: '210mm', margin: '0 auto', minHeight: '297mm' }}
    >
      {opts.draftWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.08] z-10">
          <span className="text-[80px] font-extrabold text-gray-300 rotate-[-30deg]">DRAFT</span>
        </div>
      )}

      {opts.prescriptionTypeLabel !== 'none' && (
        <div className="absolute top-8 right-8 z-10">
          <span className={cn(
            'text-[9px] font-bold uppercase tracking-widest',
            opts.prescriptionTypeLabel === 'original' ? 'text-green-600' :
            opts.prescriptionTypeLabel === 'duplicate' ? 'text-amber-600' :
            'text-gray-500'
          )}>
            [{opts.prescriptionTypeLabel.toUpperCase()}]
          </span>
        </div>
      )}

      {/* Header */}
      {opts.showLetterhead && (
        <div className="letterhead px-8 pt-8 pb-4 border-b border-gray-300">
          <div className="flex justify-between items-start">
            <div>
              <h1 className={cn('font-bold text-gray-900', opts.fontSize === 'large' ? 'text-2xl' : opts.fontSize === 'small' ? 'text-lg' : 'text-xl')}>{docName}</h1>
              <p className={cn('text-gray-700 mt-0.5', opts.fontSize === 'large' ? 'text-sm' : opts.fontSize === 'small' ? 'text-[11px]' : 'text-sm')}>{(rx.doctor?.degree || []).join(', ')}</p>
              {(rx.doctor?.specialization || []).length > 0 && (
                <p className={cn('text-gray-600 mt-0.5', opts.fontSize === 'large' ? 'text-sm' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-sm')}>{(rx.doctor.specialization || []).join(', ')}</p>
              )}
              <div className={cn('mt-1 text-gray-600 space-y-0.5', opts.fontSize === 'large' ? 'text-sm' : opts.fontSize === 'small' ? 'text-[11px]' : 'text-sm')}>
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
      )}

      {/* Body + Signature wrapper */}
      <div className="flex flex-col flex-1">

        {/* Meta */}
        {opts.showLetterhead && (
          <div className={cn('px-8 py-3 border-b border-gray-100 flex justify-between text-[9px] text-gray-500', opts.compactMode && 'px-6 py-2')}>
            <span>Rx: {rx.prescriptionNo}</span>
            <span>{new Date(rx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(rx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {/* Body */}
        <div className={cn('grid grid-cols-[3fr_9fr] gap-8', opts.compactMode ? 'p-4 gap-4' : 'p-8', fontSizeClass)}>
          {/* Left Column */}
          <div className={cn('space-y-4', opts.compactMode && 'space-y-2')}>
            {rx.patient && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Patient</p>
                <p className={cn('font-bold text-gray-900', opts.fontSize === 'large' ? 'text-[15px]' : opts.fontSize === 'small' ? 'text-[11px]' : 'text-[13px]')}>{rx.patient.fullName}</p>
                <p className={cn('text-gray-600', opts.fontSize === 'large' ? 'text-[13px]' : opts.fontSize === 'small' ? 'text-[9px]' : fontSizeClass)}>{rx.patient.age}Y · {rx.patient.gender?.charAt(0)} · {rx.patient.weight || '—'}kg</p>
                {opts.showPatientContact && rx.patient?.phone && (
                  <p className={cn('text-gray-500 mt-1', opts.fontSize === 'large' ? 'text-[11px]' : 'text-[9px]')}>
                    {rx.patient.phone}{rx.patient?.address ? ` · ${rx.patient.address}` : ''}
                  </p>
                )}
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
            {(rx.bloodPressure || rx.pulseRate || rx.temperature || rx.oxygenSaturation) && opts.showVitals && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Vitals</p>
                {rx.bloodPressure && <p className="text-gray-700">BP {rx.bloodPressure}</p>}
                {rx.pulseRate && <p className="text-gray-700">HR {rx.pulseRate}</p>}
                {rx.temperature && <p className="text-gray-700">Temp {rx.temperature}°F</p>}
                {rx.oxygenSaturation && <p className="text-gray-700">SpO₂ {rx.oxygenSaturation}%</p>}
              </div>
            )}
            {rx.diagnosis && opts.showDiagnosis && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Diagnosis</p>
                <p className="text-gray-700">{rx.diagnosis}</p>
              </div>
            )}
            {qrDataUrl && opts.showQRCode && (
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

            {sortedMedicines.length > 0 ? (
              <div className={cn('space-y-2', opts.compactMode && 'space-y-1')}>
                {sortedMedicines.map((m: any, i: number) => {
                  const prefix = getForm(m.form);
                  return (
                    <div key={i} className="pb-2 border-b border-gray-100 last:border-0">
                      <p className={cn('font-bold text-gray-900', opts.fontSize === 'large' ? 'text-[14px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[12px]')}>
                        {prefix} {m.name}{m.strength ? ` ${m.strength}` : ''}{m.genericName && opts.showGenericName ? <span className="font-normal text-gray-500"> ({m.genericName})</span> : ''}
                      </p>
                      <p className={cn('text-gray-700 ml-5', opts.fontSize === 'large' ? 'text-[13px]' : opts.fontSize === 'small' ? 'text-[9px]' : 'text-[11px]')}>
                        {formatDosage(m.dosage, opts.dosageFormat) || '—'} · {m.frequency || '—'} · {fmtDur(m.duration)}
                      </p>
                      {m.instructions && <p className={cn('text-gray-500 ml-5', opts.fontSize === 'large' ? 'text-[11px]' : opts.fontSize === 'small' ? 'text-[8px]' : 'text-[9px]')}>{m.instructions}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400">{fontSizeClass}</p>
            )}

            {rx.investigations?.filter((i: any) => i.name).length > 0 && opts.showInvestigations && (
              <div className="mt-5">
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Investigations</p>
                {rx.investigations.filter((i: any) => i.name).map((i: any, idx: number) => (
                  <p key={idx} className="text-gray-700">• {i.name}</p>
                ))}
              </div>
            )}

            {rx.advice && opts.showAdvice && (
              <div className="mt-5">
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Advice</p>
                <p className={cn('text-gray-700 break-words whitespace-pre-wrap', opts.fontSize === 'large' ? 'text-[12px]' : opts.fontSize === 'small' ? 'text-[9px]' : 'text-[10px]')}>{rx.advice}</p>
              </div>
            )}

            {rx.foodAdvice && opts.showFoodAdvice && (
              <div className="mt-5">
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Food Advice</p>
                <p className={cn('text-gray-700 break-words whitespace-pre-wrap', opts.fontSize === 'large' ? 'text-[12px]' : opts.fontSize === 'small' ? 'text-[9px]' : 'text-[10px]')}>{rx.foodAdvice}</p>
              </div>
            )}

            {rx.followUpDate && (
              <div className="mt-5">
                <p className={cn('text-gray-700', fontSizeClass)}><span className="font-bold">Follow-up:</span> {formatFollowUp(rx.followUpDate)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature */}
        {opts.showSignature && (
          <div className="signature px-8 pb-8 flex justify-end">
            <div className="text-right">
              {rx.doctor?.signatureImg ? (
                <img src={getSignatureUrl(rx.doctor)} alt="Signature" className="h-10 ml-auto mb-1 object-contain" />
              ) : (
                <div className="w-40 h-px bg-gray-400 ml-auto mb-2" />
              )}
              <p className={cn('font-bold text-gray-900 uppercase', opts.fontSize === 'large' ? 'text-[13px]' : opts.fontSize === 'small' ? 'text-[9px]' : 'text-[11px]')}>{docName}</p>
              {rx.doctor?.bmdcRegNo && <p className={cn('text-gray-500', opts.fontSize === 'large' ? 'text-[11px]' : opts.fontSize === 'small' ? 'text-[8px]' : 'text-[9px]')}>Reg No: {rx.doctor.bmdcRegNo}</p>}
            </div>
          </div>
        )}

        {opts.disclaimerText && (
          <div className="px-8 pb-2">
            <p className={cn('text-gray-400 italic', opts.fontSize === 'large' ? 'text-[10px]' : opts.fontSize === 'small' ? 'text-[7px]' : 'text-[8px]')}>{opts.disclaimerText}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!blankPrint && opts.showFooter && <div className="footer px-8 pb-4">
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