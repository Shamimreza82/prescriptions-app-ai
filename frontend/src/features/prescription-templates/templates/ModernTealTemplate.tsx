import { PrescriptionTemplateProps, defaultOptions } from '../types';
import { getDocName, getDocLogoUrl, getSignatureUrl, getForm, fmtDur, formatFollowUp, formatDosage } from '../lib/helpers';
import { cn } from '@/lib/utils';

export function ModernTealTemplate({ prescription, qrDataUrl, blankPrint, options }: PrescriptionTemplateProps) {
  const rx = prescription;
  const docName = getDocName(rx.doctor);
  const docLogo = getDocLogoUrl(rx.doctor);
  const opts = options || defaultOptions;

  const formattedDate = new Date(rx.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fontSizeSm = {
    small: 'text-[9px]',
    medium: 'text-[10px]',
    large: 'text-[12px]',
  }[opts.fontSize];

  const fontSizeBase = {
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
        'bg-white dark:bg-gray-900 overflow-hidden flex flex-col',
        opts.grayscaleMode && 'grayscale'
      )}
      style={{ width: '210mm', margin: '0 auto', minHeight: '297mm', boxSizing: 'border-box' }}
    >
      {opts.draftWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06] z-10">
          <span className="text-[80px] font-extrabold text-teal-700 rotate-[-30deg]">DRAFT</span>
        </div>
      )}

      {opts.prescriptionTypeLabel !== 'none' && (
        <div className="absolute top-8 right-8 z-10">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-2 rounded-lg',
            opts.prescriptionTypeLabel === 'original' ? 'text-green-600 border-green-500 bg-green-50' :
            opts.prescriptionTypeLabel === 'duplicate' ? 'text-amber-600 border-amber-500 bg-amber-50' :
            'text-gray-500 border-gray-400 bg-gray-50'
          )}>
            {opts.prescriptionTypeLabel}
          </span>
        </div>
      )}

      {/* Modern Teal Letterhead */}
      {opts.showLetterhead && (
        <div className="letterhead relative">
          <div className="h-2 bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-500" />
          <div className={opts.compactMode ? 'p-4 pb-3' : 'p-8 pb-6'}>
            <div className="flex justify-between items-start gap-6">
              <div className="space-y-1">
                <h1 className={cn('font-extrabold text-teal-900 dark:text-teal-200 tracking-tight', opts.fontSize === 'large' ? 'text-3xl' : opts.fontSize === 'small' ? 'text-xl' : 'text-2xl')}>{docName}</h1>
                <p className={cn('font-bold text-teal-600 dark:text-teal-400', opts.fontSize === 'large' ? 'text-sm' : opts.fontSize === 'small' ? 'text-[11px]' : 'text-sm')}>
                  {(rx.doctor?.degree || []).join(', ') || 'MBBS, FCPS'}
                </p>
                {(rx.doctor?.specialization || []).length > 0 && (
                  <p className={cn('font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider', opts.fontSize === 'large' ? 'text-sm' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-sm')}>
                    {(rx.doctor.specialization || []).join(', ')}
                  </p>
                )}
                {rx.doctor?.clinicName && (
                  <p className={cn('text-gray-700 dark:text-gray-300 mt-1', opts.fontSize === 'large' ? 'text-sm' : opts.fontSize === 'small' ? 'text-[11px]' : 'text-sm')}>{rx.doctor.clinicName}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {rx.doctor?.bmdcRegNo && <span className={fontSizeSm}>BMDC: {rx.doctor.bmdcRegNo}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                {docLogo ? (
                  <img src={docLogo} alt="Clinic" className={cn('object-contain ml-auto mb-2 rounded-lg', opts.compactMode ? 'w-12 h-12' : 'w-16 h-16')} />
                ) : (
                  <div className={cn('bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center text-white ml-auto mb-2 shadow-md shadow-teal-600/20', opts.compactMode ? 'w-12 h-12' : 'w-14 h-14')}>
                    <svg className={opts.compactMode ? 'w-6 h-6' : 'w-7 h-7'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                )}
                <p className="text-[9px] font-bold text-teal-700 dark:text-teal-400 tracking-wide uppercase">Forwarded by MEDICLOUD</p>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1">Rx No: {rx.prescriptionNo}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Separator between header and content */}
      {opts.showLetterhead && <div className="header-separator h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent dark:from-transparent dark:via-teal-700 dark:to-transparent mx-8" />}

      {/* Rx Content */}
      <div className="flex flex-col flex-1">
        <div className={cn('grid grid-cols-12 gap-8 flex-1', opts.compactMode ? 'px-4 pb-4' : 'px-8 pb-8', opts.compactMode && 'gap-4')}>
          {/* Left Column */}
          <div className={cn('col-span-4 border-r border-teal-100 dark:border-teal-900/30 space-y-6', opts.compactMode ? 'pr-3 space-y-3' : 'pr-6')}>
            {rx.patient && (
              <div className={cn('rounded-xl', opts.compactMode ? 'p-2 -mx-1' : 'p-4 -mx-2', 'bg-teal-50/50 dark:bg-teal-950/20')}>
                <h4 className={cn('font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-2', fontSizeSm)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Patient Details
                </h4>
                <p className={cn('font-extrabold text-gray-900 dark:text-white leading-tight', opts.fontSize === 'large' ? 'text-[17px]' : opts.fontSize === 'small' ? 'text-[13px]' : 'text-[15px]')}>{rx.patient.fullName}</p>
                <div className={cn('flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-gray-600 dark:text-gray-400', fontSizeSm)}>
                  <span><strong className="text-gray-800 dark:text-gray-200">Age:</strong> {rx.patient.age || '—'}Y</span>
                  <span><strong className="text-gray-800 dark:text-gray-200">Sex:</strong> {rx.patient.gender?.charAt(0) || '—'}</span>
                  <span><strong className="text-gray-800 dark:text-gray-200">Wt:</strong> {rx.patient.weight || '—'}kg</span>
                </div>
                {opts.showPatientContact && rx.patient?.phone && (
                  <p className={cn('text-gray-500 dark:text-gray-400 mt-1', fontSizeSm)}>
                    {rx.patient.phone}{rx.patient?.address ? ` | ${rx.patient.address}` : ''}
                  </p>
                )}
              </div>
            )}

            <div>
              <h4 className={cn('font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-2', fontSizeSm)}>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Chief Complaint
              </h4>
              {(rx.chiefComplaint || '').split('\n').filter(Boolean).length > 0 ? (
                <ul className="space-y-1">
                  {(rx.chiefComplaint || '').split('\n').filter(Boolean).map((item, i) => (
                    <li key={i} className={cn('text-gray-700 dark:text-gray-300 flex items-start gap-2', fontSizeBase)}>
                      <span className="text-teal-500 mt-1.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={cn('text-gray-400', fontSizeBase)}>—</p>
              )}
            </div>

            {rx.symptoms && (
              <div>
                <h4 className={cn('font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-2', fontSizeSm)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Symptoms
                </h4>
                <p className={cn('text-gray-700 dark:text-gray-300 leading-relaxed', fontSizeBase)}>{rx.symptoms}</p>
              </div>
            )}

            {(rx.bloodPressure || rx.pulseRate || rx.temperature || rx.oxygenSaturation) && opts.showVitals && (
              <div>
                <h4 className={cn('font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2', fontSizeSm)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Vitals
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {rx.bloodPressure && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-2 text-center">
                      <p className={cn('font-bold text-rose-500 uppercase', fontSizeSm)}>BP</p>
                      <p className={cn('font-extrabold text-gray-800 dark:text-gray-200', opts.fontSize === 'large' ? 'text-[14px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[12px]')}>{rx.bloodPressure}</p>
                    </div>
                  )}
                  {rx.pulseRate && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-2 text-center">
                      <p className={cn('font-bold text-rose-500 uppercase', fontSizeSm)}>Pulse</p>
                      <p className={cn('font-extrabold text-gray-800 dark:text-gray-200', opts.fontSize === 'large' ? 'text-[14px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[12px]')}>{rx.pulseRate}</p>
                    </div>
                  )}
                  {rx.temperature && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-2 text-center">
                      <p className={cn('font-bold text-rose-500 uppercase', fontSizeSm)}>Temp</p>
                      <p className={cn('font-extrabold text-gray-800 dark:text-gray-200', opts.fontSize === 'large' ? 'text-[14px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[12px]')}>{rx.temperature}°F</p>
                    </div>
                  )}
                  {rx.oxygenSaturation && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-2 text-center">
                      <p className={cn('font-bold text-rose-500 uppercase', fontSizeSm)}>SpO₂</p>
                      <p className={cn('font-extrabold text-gray-800 dark:text-gray-200', opts.fontSize === 'large' ? 'text-[14px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[12px]')}>{rx.oxygenSaturation}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {rx.diagnosis && opts.showDiagnosis && (
              <div>
                <h4 className={cn('font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2', fontSizeSm)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Diagnosis
                </h4>
                <p className={cn('text-gray-700 dark:text-gray-300 leading-relaxed', fontSizeBase)}>{rx.diagnosis}</p>
              </div>
            )}

            {qrDataUrl && opts.showQRCode && (
              <div className="pt-2">
                <div className="inline-block bg-white dark:bg-gray-900 p-2 rounded-xl border border-teal-100 dark:border-teal-900/30 shadow-sm">
                  <img src={qrDataUrl} alt="QR" className="w-20 h-20" />
                </div>
                <p className="text-[9px] font-semibold text-black dark:text-white mt-1">Scan for e-validation</p>
                {blankPrint && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-0.5 text-[9px] text-gray-500">
                    <p>Rx: {rx.prescriptionNo}</p>
                    <p>{formattedDate}</p>
                    {rx.doctor?.bmdcRegNo && <p>BMDC: {rx.doctor.bmdcRegNo}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="col-span-8 space-y-6 min-w-0">
            {/* Rx Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl italic font-bold text-teal-700 dark:text-teal-400 font-serif">Rx</span>
              <div className="h-px flex-1 bg-gradient-to-r from-teal-300 to-transparent dark:from-teal-700" />
            </div>

            {/* Medicines */}
            {sortedMedicines.length > 0 ? (
              <div className={cn('space-y-4', opts.compactMode && 'space-y-2')}>
                {sortedMedicines.map((m: any, i: number) => {
                  const prefix = getForm(m.form);
                  return (
                    <div
                      key={i}
                      className={cn('pb-4 border-b border-dashed border-teal-100 dark:border-teal-900/30 last:border-0', opts.compactMode && 'pb-2')}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 text-teal-600 dark:text-teal-400 font-serif italic font-bold text-lg">℞</span>
                        <div className="flex-1">
                          <p className={cn('font-extrabold text-gray-900 dark:text-white leading-snug', opts.fontSize === 'large' ? 'text-[16px]' : opts.fontSize === 'small' ? 'text-[12px]' : 'text-[14px]')}>
                            {prefix} {m.name}
                            {m.strength ? <span className="text-teal-700 dark:text-teal-400 ml-1">{m.strength}</span> : ''}
                            {m.genericName && opts.showGenericName ? (
                              <span className="font-normal text-black dark:text-gray-400 text-[12px]"> ({m.genericName})</span>
                            ) : ''}
                          </p>
                          <p className={cn('font-bold text-gray-700 dark:text-gray-300 mt-1', opts.fontSize === 'large' ? 'text-[14px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[12px]')}>
                            {formatDosage(m.dosage, opts.dosageFormat) || '—'} · {m.frequency || '—'} · {fmtDur(m.duration)}
                          </p>
                          {m.instructions && (
                            <p className={cn('text-gray-500 dark:text-gray-400 mt-1 italic', opts.fontSize === 'large' ? 'text-[13px]' : opts.fontSize === 'small' ? 'text-[9px]' : 'text-[11px]')}>
                              {m.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={cn('text-gray-500', fontSizeBase)}>No medicines prescribed</p>
            )}

            {/* Investigations */}
            {rx.investigations?.filter((i: any) => i.name).length > 0 && opts.showInvestigations && (
              <div className={cn('rounded-xl', opts.compactMode ? 'p-2' : 'p-4', 'bg-purple-50/50 dark:bg-purple-950/20')}>
                <h4 className={cn('font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider border-b-2 border-purple-200 dark:border-purple-800 pb-1 mb-3 flex items-center gap-2', fontSizeSm)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Investigations
                </h4>
                <ul className="space-y-1.5">
                  {rx.investigations.filter((i: any) => i.name).map((i: any, idx: number) => (
                    <li key={idx} className={cn('text-gray-800 dark:text-gray-200 flex items-start gap-2', fontSizeBase)}>
                      <span className="text-purple-500 mt-1">•</span>
                      {i.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advice */}
            {rx.advice && opts.showAdvice && (
              <div className={cn('rounded-xl', opts.compactMode ? 'p-2' : 'p-4', 'bg-emerald-50/50 dark:bg-emerald-950/20')}>
                <h4 className={cn('font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider border-b-2 border-emerald-200 dark:border-emerald-800 pb-1 mb-2 flex items-center gap-2', fontSizeSm)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Advice
                </h4>
                <p className={cn('text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap', fontSizeBase)}>{rx.advice}</p>
              </div>
            )}

            {/* Food Advice */}
            {rx.foodAdvice && opts.showFoodAdvice && (
              <div className={cn('rounded-xl', opts.compactMode ? 'p-2' : 'p-4', 'bg-emerald-50/50 dark:bg-emerald-950/20')}>
                <h4 className={cn('font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider border-b-2 border-emerald-200 dark:border-emerald-800 pb-1 mb-2 flex items-center gap-2', fontSizeSm)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Food Advice
                </h4>
                <p className={cn('text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap', fontSizeBase)}>{rx.foodAdvice}</p>
              </div>
            )}

            {/* Follow-up */}
            {rx.followUpDate && (
              <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-full border border-amber-100 dark:border-amber-900/30">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={cn('font-bold', fontSizeBase)}>
                  Follow-up: <span className="text-gray-800 dark:text-gray-200">{formatFollowUp(rx.followUpDate)}</span>
                </span>
              </div>
            )}

            {/* Signature & Footer */}
            <div className={cn('flex justify-between items-end', opts.compactMode ? 'pt-4' : 'pt-8', 'mt-auto')}>
              <div className={cn('text-gray-400 space-y-0.5', fontSizeSm)}>
                <p>Rx No: {rx.prescriptionNo}</p>
                <p>{formattedDate}</p>
                {rx.updatedAt && rx.updatedAt !== rx.createdAt && (
                  <p>Updated: {new Date(rx.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                )}
              </div>
              {opts.showSignature && (
                <div className="signature text-right">
                  {rx.doctor?.signatureImg ? (
                    <img src={getSignatureUrl(rx.doctor)} alt="Signature" className={cn('ml-auto mb-2 object-contain', opts.compactMode ? 'h-10' : 'h-12')} />
                  ) : (
                    <div className="w-44 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent ml-auto mb-3" />
                  )}
                  <p className={cn('font-extrabold text-gray-900 dark:text-white uppercase tracking-wide', opts.fontSize === 'large' ? 'text-[14px]' : opts.fontSize === 'small' ? 'text-[10px]' : 'text-[12px]')}>{docName}</p>
                  {rx.doctor?.bmdcRegNo && <p className={cn('text-gray-500 dark:text-gray-400', opts.fontSize === 'large' ? 'text-[12px]' : opts.fontSize === 'small' ? 'text-[9px]' : 'text-[10px]')}>Reg No: {rx.doctor.bmdcRegNo}</p>}
                </div>
              )}
            </div>

            {opts.disclaimerText && (
              <p className={cn('text-gray-400 italic', opts.fontSize === 'large' ? 'text-[10px]' : opts.fontSize === 'small' ? 'text-[7px]' : 'text-[9px]')}>{opts.disclaimerText}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {!blankPrint && opts.showFooter && <div className="footer px-8 pb-4">
        <div className="border-t border-teal-100 dark:border-teal-900/30 pt-3 flex items-center justify-between text-[9px] text-gray-500 dark:text-gray-400">
          <div className="space-y-0.5">
            {rx.doctor?.clinicAddress && <p>{rx.doctor.clinicAddress}</p>}
            {rx.doctor?.phone && <p>Phone: {rx.doctor.phone}</p>}
            {rx.doctor?.user?.email && <p>Email: {rx.doctor.user.email}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold text-teal-700 dark:text-teal-400">MEDICLOUD</p>
            <p>Digitally Generated Prescription</p>
          </div>
        </div>
      </div>}
    </div>
  );
}