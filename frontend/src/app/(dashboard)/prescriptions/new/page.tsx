'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/axios';
import { useCreatePrescription } from '@/features/prescriptions/hooks';
import { downloadPrescriptionPDF } from '@/features/prescriptions/api';
import { prescriptionSchema } from '@/features/prescriptions/schema';
import { useMySubscription } from '@/features/plans/hooks';
import { toast } from 'sonner';
import { z } from 'zod';
import { AlertTriangle, Plus, Trash2, Search, X, User, Pill, FlaskConical, Activity } from 'lucide-react';
import { useMedicineSearch, useLabTestSearch, useIndicationSearch } from '@/features/medicine/hooks';
import { formatFollowUp } from '@/lib/utils';
import QRCodeLib from 'qrcode';

type FormData = z.infer<typeof prescriptionSchema>;
const emptyMedicine = { name: '', strength: '', form: '', dosage: '', frequency: '', duration: '', instructions: '' };

const formAbbr: Record<string, string> = {
  'Tablet': 'TAB.', 'Capsule': 'CAP.', 'Injection': 'INJ.', 'Inject': 'INJ.',
  'Syrup': 'SYP.', 'Cream': 'CRM.', 'Ointment': 'OINT.', 'Gel': 'GEL.',
  'Drop': 'DROP.', 'Inhaler': 'INH.', 'Suspension': 'SUSP.', 'Solution': 'SOLN.',
  'Lotion': 'LOT.', 'Spray': 'SPRAY.', 'Powder': 'PDR.', 'Sachet': 'SACH.',
};
const getForm = (f?: string) => (f ? formAbbr[f] || f.toUpperCase() + '.' : '');
const fmtDur = (d?: string) => (d ? (/day/i.test(d) ? d : `${d} Days`) : '—');

function NewPrescriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const create = useCreatePrescription();
  const { data: subscription } = useMySubscription();
  const [rxCount, setRxCount] = useState(0);
  const [profileStatus, setProfileStatus] = useState<{ isProfileComplete: boolean; isVerified: boolean; loading: boolean }>({ isProfileComplete: true, isVerified: true, loading: true });
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);

  const [activeMedIndex, setActiveMedIndex] = useState<number | null>(null);
  const [showInvDropdown, setShowInvDropdown] = useState(false);
  const [medQuery, setMedQuery] = useState('');
  const [invQuery, setInvQuery] = useState('');
  const [debouncedMedQuery, setDebouncedMedQuery] = useState('');
  const [debouncedInvQuery, setDebouncedInvQuery] = useState('');
  const [ccQuery, setCcQuery] = useState('');
  const [debouncedCcQuery, setDebouncedCcQuery] = useState('');
  const [showCcDropdown, setShowCcDropdown] = useState(false);
  const [ccItems, setCcItems] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [followUpPreset, setFollowUpPreset] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const handleFollowUpPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFollowUpPreset(val);
    if (val) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(val));
      setValue('followUpDate', d.toISOString().split('T')[0], { shouldValidate: true });
    }
  };

  const medSearch = useMedicineSearch(debouncedMedQuery);
  const invSearch = useLabTestSearch(debouncedInvQuery);
  const ccSearch = useIndicationSearch(debouncedCcQuery);

  useEffect(() => {
    api.get('/patients?limit=100').then((r) => setPatients(r.data.data)).catch((e) => console.error(e));
    api.get('/doctors/profile').then((r) => {
      const p = r.data.data;
      setDoctorProfile(p);
      setProfileStatus({ isProfileComplete: p.isProfileComplete, isVerified: p.user?.isVerified, loading: false });
    }).catch((e) => { console.error(e); setProfileStatus((s) => ({ ...s, loading: false })); });
    api.get('/prescriptions?limit=1').then((r) => setRxCount(r.data.total || 0)).catch(() => {});
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    QRCodeLib.toDataURL(`${apiBase}/verify`, { width: 120, margin: 1, color: { dark: '#111827', light: '#ffffff' } })
      .then(setQrDataUrl).catch((e) => console.error(e));
  }, []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: searchParams.get('patientId') || '',
      symptoms: '', chiefComplaint: '', diagnosis: '', diagnosisNotes: '',
      bloodPressure: '', pulseRate: '', temperature: '', oxygenSaturation: '',
      advice: '', foodAdvice: '', followUpDate: '',
      medicines: [emptyMedicine],
      investigations: [],
    },
  });

  const { fields: medFields, append: addMed, remove: removeMed } = useFieldArray({ control, name: 'medicines' });
  const { fields: invFields, append: addInv, remove: removeInv } = useFieldArray({ control, name: 'investigations' });

  const addInvestigation = useCallback(() => {
    setShowInvDropdown(true);
    setInvQuery('');
    requestAnimationFrame(() => {
      document.getElementById('inv-input')?.focus();
    });
  }, []);

  const medDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const invDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ccDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const medDropdownRef = useRef<HTMLDivElement>(null);
  const invDropdownRef = useRef<HTMLDivElement>(null);
  const ccDropdownRef = useRef<HTMLDivElement>(null);

  const handleMedInputChange = useCallback((i: number, value: string) => {
    setActiveMedIndex(i);
    setMedQuery(value);
    setValue(`medicines.${i}.name`, value, { shouldValidate: true });
    if (medDebounce.current) clearTimeout(medDebounce.current);
    medDebounce.current = setTimeout(() => setDebouncedMedQuery(value), 300);
  }, [setValue]);

  const handleInvInputChange = useCallback((value: string) => {
    setInvQuery(value);
    setShowInvDropdown(true);
    if (invDebounce.current) clearTimeout(invDebounce.current);
    invDebounce.current = setTimeout(() => setDebouncedInvQuery(value), 300);
  }, []);

  const selectMedicine = useCallback((i: number, name: string, strength?: string, form?: string, genericName?: string) => {
    setValue(`medicines.${i}.name`, name, { shouldValidate: true });
    if (strength) setValue(`medicines.${i}.strength`, strength, { shouldValidate: true });
    if (form) setValue(`medicines.${i}.form`, form, { shouldValidate: true });
    if (genericName) setValue(`medicines.${i}.genericName`, genericName, { shouldValidate: true });
    setActiveMedIndex(null);
    setMedQuery('');
    setDebouncedMedQuery('');
  }, [setValue]);

  const selectLabTest = useCallback((name: string) => {
    const current = watch('investigations') || [];
    if (current.some(i => i.name === name)) return;
    addInv({ name, notes: '' });
    setShowInvDropdown(false);
    setInvQuery('');
    setDebouncedInvQuery('');
  }, [addInv, watch]);

  const handleCcInputChange = useCallback((value: string) => {
    setCcQuery(value);
    setShowCcDropdown(true);
    if (ccDebounce.current) clearTimeout(ccDebounce.current);
    ccDebounce.current = setTimeout(() => setDebouncedCcQuery(value), 300);
  }, []);

  const selectIndication = useCallback((name: string) => {
    if (ccItems.includes(name)) return;
    const newItems = [...ccItems, name];
    setCcItems(newItems);
    setValue('chiefComplaint', newItems.join('\n'), { shouldValidate: true });
    setShowCcDropdown(false);
    setCcQuery('');
    setDebouncedCcQuery('');
  }, [ccItems, setValue]);

  const removeCcItem = useCallback((index: number) => {
    const newItems = ccItems.filter((_, i) => i !== index);
    setCcItems(newItems);
    setValue('chiefComplaint', newItems.join('\n'), { shouldValidate: true });
  }, [ccItems, setValue]);

  const handleCcKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ccQuery.trim()) {
      e.preventDefault();
      const name = ccQuery.trim();
      if (ccItems.includes(name)) return;
      const newItems = [...ccItems, name];
      setCcItems(newItems);
      setValue('chiefComplaint', newItems.join('\n'), { shouldValidate: true });
      setCcQuery('');
      setDebouncedCcQuery('');
      setShowCcDropdown(false);
    }
  }, [ccItems, ccQuery, setValue]);

  const handleInvKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && invQuery.trim()) {
      e.preventDefault();
      const name = invQuery.trim();
      const current = watch('investigations') || [];
      if (current.some(i => i.name === name)) return;
      addInv({ name, notes: '' });
      setInvQuery('');
      setDebouncedInvQuery('');
      setShowInvDropdown(false);
    }
  }, [invQuery, watch, addInv]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (medDropdownRef.current && !medDropdownRef.current.contains(e.target as Node)) {
        setActiveMedIndex(null);
      }
      if (invDropdownRef.current && !invDropdownRef.current.contains(e.target as Node)) {
        setShowInvDropdown(false);
      }
      if (ccDropdownRef.current && !ccDropdownRef.current.contains(e.target as Node)) {
        setShowCcDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const watchPatientId = watch('patientId');
  useEffect(() => {
    if (watchPatientId && patients.length) {
      const p = patients.find((p) => p.id === watchPatientId);
      setSelectedPatient(p || null);
    }
  }, [watchPatientId, patients]);

  const onSubmit = async (data: FormData) => {
    try {
      const rx = await create.mutateAsync({
        ...data,
        followUpDate: data.followUpDate || undefined,
        investigations: data.investigations?.filter((i) => i.name),
      });
      downloadPrescriptionPDF(rx.id);
      router.push(`/prescriptions/${rx.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create prescription');
    }
  };

  const meds = watch('medicines') || [];
  const invs = watch('investigations') || [];

  const saveDraft = () => {
    const formData = watch();
    localStorage.setItem('prescription-draft', JSON.stringify(formData));
    toast.success('Draft saved');
  };

  const clearDraft = () => {
    localStorage.removeItem('prescription-draft');
    reset({});
    toast.success('Draft cleared');
  };

  useEffect(() => {
    const saved = localStorage.getItem('prescription-draft');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        reset(data);
      } catch (e) { console.error(e); }
    }
  }, [reset]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-gray-950 pb-24">
      <div className="max-w-[1600px] mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button type="button" onClick={() => router.push('/prescriptions')} className="p-2.5 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">New Prescription</h1>
            <p className="text-sm text-gray-400">Create a new prescription for your patient</p>
          </div>
        </div>
        <div className="flex items-center justify-end mb-4">
          <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-xs font-bold text-teal-600 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
        <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* ===== LEFT SIDE: Prescription Builder ===== */}
        <div className={cn("col-span-12 space-y-6 sm:space-y-8", showPreview ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12 xl:col-span-12")}>

          {!profileStatus.loading && (!profileStatus.isVerified || !profileStatus.isProfileComplete) && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {!profileStatus.isVerified ? 'Account Pending Approval' : 'Profile Incomplete'}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  {!profileStatus.isVerified
                    ?  'Please complete your profile before creating prescriptions. You must have a BMDC number added for verification.'
                    : 'Your account has not been verified by an admin yet.'}
                </p>
              </div>
            </div>
          )}

          {subscription && rxCount >= subscription.prescriptionLimit && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Prescription Limit Reached
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                  You have used all {subscription.prescriptionLimit} prescriptions in your current plan ({subscription.plan?.name || 'Free'}). Upgrade your subscription to create more prescriptions.
                </p>
              </div>
            </div>
          )}

          {subscription && rxCount > 0 && rxCount < subscription.prescriptionLimit && rxCount >= subscription.prescriptionLimit * 0.85 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Approaching Prescription Limit
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  You have used {rxCount} of {subscription.prescriptionLimit} prescriptions ({Math.round((rxCount / subscription.prescriptionLimit) * 100)}%). Consider upgrading your plan.
                </p>
              </div>
            </div>
          )}

          {/* A. Patient Selection */}
          <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-transparent">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 block">Patient <span className="text-red-500">*</span></label>
            {errors.patientId && <p className="text-xs text-red-500 mb-2">{errors.patientId.message as string}</p>}
            {watchPatientId && selectedPatient ? (
              <div className={cn("flex items-center gap-5", errors.patientId ? "p-3 rounded-xl ring-2 ring-red-500" : "")}>
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-2xl shrink-0">
                  {selectedPatient.fullName?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-headline leading-tight">{selectedPatient.fullName}</h2>
                  <div className="flex items-center gap-3 mt-1 text-gray-500 dark:text-gray-400 font-medium text-sm">
                    <span>{selectedPatient.gender?.charAt(0) || '?'}, {selectedPatient.age || '?'} Years</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>ID: {selectedPatient.patientId || '—'}</span>
                    {selectedPatient.phone && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{selectedPatient.phone}</span>
                      </>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => { setValue('patientId', ''); setSelectedPatient(null); }} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className={cn("relative rounded-xl", errors.patientId ? "ring-2 ring-red-500" : "")}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  placeholder="Search Patient (Name, ID or Mobile)..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setShowPatientResults(true); }}
                  onFocus={() => setShowPatientResults(true)}
                  className="w-full bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none placeholder:text-gray-400"
                />
                {showPatientResults && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPatientResults(false)} />
                    <div className="absolute top-full mt-1 left-0 right-0 z-20 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl animate-fade-in">
                      {patients.filter((p) =>
                        !patientSearch ||
                        p.fullName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                        p.patientId?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                        (p.phone && p.phone.includes(patientSearch))
                      ).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No patients found</p>
                      ) : (
                        patients.filter((p) =>
                          !patientSearch ||
                          p.fullName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                          p.patientId?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                          (p.phone && p.phone.includes(patientSearch))
                        ).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setValue('patientId', p.id, { shouldValidate: true }); setPatientSearch(p.fullName); setShowPatientResults(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <User className="h-4 w-4 text-gray-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.fullName}</p>
                              <p className="text-xs text-gray-400 truncate">{p.patientId}{p.phone ? ` · ${p.phone}` : ''}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {selectedPatient && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Weight / ওজন</p>
                  <p className="text-lg font-bold text-teal-800 dark:text-teal-300">{selectedPatient.weight || '—'} <span className="text-xs font-medium text-gray-400">kg</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Blood Group / রক্ত</p>
                  <p className="text-lg font-bold text-red-600">{selectedPatient.bloodGroup?.replace('_', '+') || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Last Visit / শেষ</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedPatient.lastVisit || '—'}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full text-xs font-bold border border-teal-100 dark:border-teal-800">
                    <span className="animate-pulse w-2 h-2 bg-teal-500 rounded-full" />
                    Auto-saving draft
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Draft mode</p>
                </div>
              </div>
            )}
          </section>

          {/* B. Clinical Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  Chief Complaint / প্রধান সমস্যা
                  <span className="text-[10px] text-gray-400 font-normal">CC</span>
                </label>
              </div>
              <div className="relative" ref={ccDropdownRef}>
                {ccItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ccItems.map((item, i) => (
                      <span key={i} className="bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-lg text-xs font-bold border border-teal-100 dark:border-teal-800 flex items-center gap-1">
                        {item}
                        <button type="button" onClick={() => removeCcItem(i)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  value={ccQuery}
                  onChange={(e) => handleCcInputChange(e.target.value)}
                  onFocus={() => ccQuery.length >= 2 && setShowCcDropdown(true)}
                  onKeyDown={handleCcKeyDown}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none shadow-sm"
                  placeholder="Type a chief complaint and press Enter or select from suggestions..."
                />
                {showCcDropdown && ccQuery.length >= 2 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl">
                    {ccSearch.isLoading ? (
                      <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
                    ) : !ccSearch.data || ccSearch.data.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No results found</p>
                    ) : (
                      ccSearch.data.map((ind) => (
                        <button
                          key={ind.id}
                          type="button"
                          onClick={() => selectIndication(ind.name)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                        >
                          <Activity className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ind.name}</p>
                            <p className="text-xs text-gray-400">Indication</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    Diagnosis / রোগ নির্ণয়
                  </label>
                </div>
                <textarea
                  {...register('diagnosis')}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none min-h-[80px] shadow-sm resize-none"
                  placeholder="Enter diagnosis..."
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-800 dark:text-gray-200">Vitals / ভাইটালস</label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">BP</p>
                  <input {...register('bloodPressure')} placeholder="120/80" className="w-full bg-transparent text-center font-bold text-teal-800 dark:text-teal-300 text-sm outline-none" />
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Pulse</p>
                  <div className="flex items-center justify-center">
                    <input {...register('pulseRate')} placeholder="72" className="w-12 bg-transparent text-center font-bold text-teal-800 dark:text-teal-300 text-sm outline-none" />
                    <span className="text-[10px] text-gray-400 font-normal ml-0.5">bpm</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">SpO2</p>
                  <div className="flex items-center justify-center">
                    <input {...register('oxygenSaturation')} placeholder="98" className="w-10 bg-transparent text-center font-bold text-teal-800 dark:text-teal-300 text-sm outline-none" />
                    <span className="text-[10px] text-gray-400 font-normal">%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input {...register('temperature')} placeholder="Temp (°F)" className="flex-1 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-full px-4 py-2 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none" />
                <input {...register('symptoms')} placeholder="Symptom (জ্বর, কাশি)..." className="flex-[2] bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-full px-4 py-2 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none" />
              </div>
            </div>
          </section>

          {/* C. Conflict Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 p-4 flex items-center gap-4 rounded-r-xl">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Drug Interaction Warning</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Check for potential interactions before finalizing.</p>
            </div>
          </div>

          {/* D. Medicine Entry */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-teal-500/10 shadow-lg relative">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                Alt + N
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-500/10 text-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </span>
              Add Medication / ঔষধ যোগ করুন
            </h3>

            {errors.medicines && !Array.isArray(errors.medicines) && (
              <p className="text-xs text-red-500 mb-4">{errors.medicines.message as string}</p>
            )}

            <div className="space-y-4">
              {medFields.map((field, i) => (
                <div key={field.id} className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-3 sm:p-4 space-y-3 border border-gray-100 dark:border-gray-700/50">
                <div className="grid grid-cols-12 gap-3 sm:gap-4 items-start">
                    <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Medicine <span className="text-red-500">*</span></label>
                      <div className="relative" ref={activeMedIndex === i ? medDropdownRef : undefined}>
                        <input
                          value={activeMedIndex === i ? medQuery : watch(`medicines.${i}.name`)}
                          onChange={(e) => handleMedInputChange(i, e.target.value)}
                          onFocus={() => { setActiveMedIndex(i); setMedQuery(watch(`medicines.${i}.name`)); }}
                          placeholder="Type Brand or Generic name..."
                          className={cn("w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none", errors.medicines?.[i]?.name && 'border-red-500')}
                        />
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        {activeMedIndex === i && medQuery.length >= 2 && (
                          <div className="absolute top-full mt-1 left-0 right-0 z-30 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl">
                            {medSearch.isLoading ? (
                              <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
                            ) : medSearch.data?.brands.length === 0 && medSearch.data?.generics.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-4">No results found</p>
                            ) : (
                              <>
                                {medSearch.data?.brands.slice(0, 5).map((b) => (
                                  <button
                                    key={`brand-${b.id}`}
                                    type="button"
                                    onClick={() => selectMedicine(i, b.name, b.strength, b.form, b.generic?.name)}
                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                                  >
                                    <Pill className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{b.name} <span className="text-xs font-normal text-gray-500">{b.strength}</span></p>
                                      <p className="text-xs text-gray-400 truncate">{b.company?.name} · {b.form}</p>
                                    </div>
                                  </button>
                                ))}
                                {medSearch.data?.generics.slice(0, 5).map((g) => (
                                  <button
                                    key={`generic-${g.id}`}
                                    type="button"
                                    onClick={() => selectMedicine(i, g.name)}
                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                                  >
                                    <FlaskConical className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{g.name}</p>
                                      <p className="text-xs text-gray-400 truncate">Generic</p>
                                    </div>
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.medicines?.[i]?.name && <p className="text-xs text-red-500">{errors.medicines[i]?.name?.message}</p>}
                    </div>
                  <div className="col-span-6 sm:col-span-4 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Strength <span className="text-red-500">*</span></label>
                    <input {...register(`medicines.${i}.strength`)} placeholder="665mg" className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none text-center font-semibold" />
                  </div>
                  <div className="col-span-12 sm:col-span-4 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Dose <span className="text-red-500">*</span></label>
                    <input list={`dosage-suggestions-${i}`} {...register(`medicines.${i}.dosage`)} placeholder="1+0+1" className={cn("w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none text-center font-bold tracking-widest", errors.medicines?.[i]?.dosage && 'border-red-500')} />
                    <datalist id={`dosage-suggestions-${i}`}>
                      <option value="1+0+0" />
                      <option value="0+0+1" />
                      <option value="1+0+1" />
                      <option value="1+1+0" />
                      <option value="½+0+½" />
                      <option value="1+1+1" />
                      <option value="1½+0+1½" />
                      <option value="2+0+2" />
                      <option value="1+1+½" />
                      <option value="½+½+½" />
                      <option value="1+0+½" />
                      <option value="2+0+0" />
                      <option value="0+0+2" />
                      <option value="1+0+0+1" />
                    </datalist>
                    {errors.medicines?.[i]?.dosage && <p className="text-xs text-red-500">{errors.medicines[i]?.dosage?.message}</p>}
                  </div>
                  <div className="col-span-12 sm:col-span-4 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Freq</label>
                    <input list={`freq-suggestions-${i}`} {...register(`medicines.${i}.frequency`)} placeholder="সকাল + রাত" className={cn("w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none", errors.medicines?.[i]?.frequency && 'border-red-500')} />
                    <datalist id={`freq-suggestions-${i}`}>
                      <option value="সকাল" />
                      <option value="দুপুর" />
                      <option value="রাত" />
                      <option value="সকাল + দুপুর" />
                      <option value="সকাল + রাত" />
                      <option value="দুপুর + রাত" />
                      <option value="সকাল + দুপুর + রাত" />
                      <option value="প্রতি ৪ ঘণ্টা" />
                      <option value="প্রতি ৬ ঘণ্টা" />
                      <option value="প্রতি ৮ ঘণ্টা" />
                      <option value="প্রয়োজন মত" />
                      <option value="সকাল ১ + রাত ১" />
                      <option value="সকাল ১ + দুপুর ১ + রাত ১" />
                    </datalist>
                    {errors.medicines?.[i]?.frequency && <p className="text-xs text-red-500">{errors.medicines[i]?.frequency?.message}</p>}
                  </div>
                  <div className="col-span-6 sm:col-span-3 md:col-span-1 space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Days <span className="text-red-500">*</span></label>
                    <input list={`duration-suggestions-${i}`} {...register(`medicines.${i}.duration`)} placeholder="7" className={cn("w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none text-center font-bold", errors.medicines?.[i]?.duration && 'border-red-500')} />
                    <datalist id={`duration-suggestions-${i}`}>
                      <option value="3 Days" />
                      <option value="5 Days" />
                      <option value="7 Days" />
                      <option value="10 Days" />
                      <option value="14 Days" />
                      <option value="21 Days" />
                      <option value="30 Days" />
                      <option value="45 Days" />
                      <option value="60 Days" />
                      <option value="90 Days" />
                    </datalist>
                    {errors.medicines?.[i]?.duration && <p className="text-xs text-red-500">{errors.medicines[i]?.duration?.message}</p>}
                  </div>
                  <div className="col-span-6 sm:col-span-3 md:col-span-1 flex items-end justify-end pt-1.5">
                    {medFields.length > 1 && (
                      <button type="button" onClick={() => removeMed(i)} className="p-3.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border border-transparent hover:border-red-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Instructions / নির্দেশনা</label>
                    <textarea
                      {...register(`medicines.${i}.instructions`)}
                      placeholder="e.g. Before meal, Avoid dairy..."
                      rows={2}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button type="button" onClick={() => addMed(emptyMedicine)} className="flex-1 bg-teal-600 text-white font-bold h-[54px] rounded-xl shadow-md shadow-teal-600/20 hover:scale-[1.01] transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm">
                <Plus className="w-5 h-5" /> Add to Prescription
              </button>
            </div>
          </section>

          {/* Investigations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                Investigations / ল্যাব টেস্ট
                <span className="text-[10px] text-gray-400 font-normal">Lab</span>
              </label>
            </div>
            <div className="relative" ref={invDropdownRef}>
              {invFields.filter((_, i) => watch(`investigations.${i}.name`)).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {invFields.map((field, i) => {
                    const name = watch(`investigations.${i}.name`);
                    if (!name) return null;
                    return (
                      <span key={field.id} className="bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-lg text-xs font-bold border border-teal-100 dark:border-teal-800 flex items-center gap-1">
                        {name}
                        <button type="button" onClick={() => removeInv(i)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <input
                id="inv-input"
                value={invQuery}
                onChange={(e) => handleInvInputChange(e.target.value)}
                onFocus={() => invQuery.length >= 2 && setShowInvDropdown(true)}
                onKeyDown={handleInvKeyDown}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none shadow-sm"
                placeholder="Type a test name and press Enter or select from suggestions..."
              />
              {showInvDropdown && invQuery.length >= 2 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl">
                  {invSearch.isLoading ? (
                    <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
                  ) : !invSearch.data || invSearch.data.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No tests found</p>
                  ) : (
                    invSearch.data.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectLabTest(t.name)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                      >
                        <FlaskConical className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.shortName && `${t.shortName} · `}{t.category}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* E. Medicine Table */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Medicine Name &amp; Generic</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dose &amp; Freq</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Duration</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instructions</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {medFields.filter((_, i) => watch(`medicines.${i}.name`)).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No medicines added yet</td>
                  </tr>
                ) : (
                  medFields.map((field, i) => {
                    const m = watch(`medicines.${i}`);
                    if (!m.name) return null;
                    return (
                      <tr key={field.id} className="bg-white dark:bg-gray-900 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900 dark:text-white">{getForm(m.form)} {m.name}{m.strength ? ` ${m.strength}` : ''}{m.genericName ? ` (${m.genericName})` : ''}</p>
                          <p className="text-xs text-gray-400">{m.genericName || m.strength ? `${m.genericName || ''}${m.genericName && m.strength ? ' · ' : ''}${m.strength || ''}` : ''}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{m.dosage || '—'}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{m.frequency || ''}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-xs font-bold">{m.duration || '—'} Days</span>
                        </td>
                        <td className="px-6 py-5">
                          {m.instructions ? <p className="text-xs text-gray-500 italic max-w-[200px] truncate">{m.instructions}</p> : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" className="p-2 text-gray-400 hover:text-teal-600 transition-colors" title="Copy">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                            <button type="button" onClick={() => removeMed(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>

          {/* F. Advice & Tests */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-800 dark:text-gray-200">Lifestyle Advice / পরামর্শ</label>
              <textarea {...register('advice')} className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none min-h-[120px] shadow-sm resize-none" placeholder="e.g. Walk 30 mins daily, Low salt diet..." />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-800 dark:text-gray-200">Food Advice / খাদ্য</label>
              <textarea {...register('foodAdvice')} className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none min-h-[80px] shadow-sm resize-none" placeholder="Dietary recommendations..." />
              <label className="text-sm font-bold text-gray-800 dark:text-gray-200">Follow-up / পুনরায়</label>
              <div className="flex gap-2">
                <select
                  value={followUpPreset}
                  onChange={handleFollowUpPreset}
                  className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none appearance-none"
                >
                  <option value="">Quick select</option>
                  <option value="1">1 Day</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">1 Month</option>
                </select>
                <input
                  type="date"
                  {...register('followUpDate')}
                  onChange={(e) => {
                    setFollowUpPreset('');
                    register('followUpDate').onChange(e);
                  }}
                  className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
                />
              </div>
            </div>
          </section>

        </div>

        {/* ===== RIGHT SIDE: Live Preview Panel ===== */}
        {showPreview && <aside className="col-span-12 lg:col-span-5 xl:col-span-4">
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Prescription Preview
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-white dark:bg-gray-900 px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Cmd + S
              </div>
            </div>

            {/* Printable Sheet Simulation */}
            <div id="print-content" className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden min-h-[842px] relative transform origin-top transition-transform duration-500 border border-gray-100 dark:border-gray-800">
              {/* Letterhead */}
              <div className="p-8 border-b-4 border-teal-600">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h1 className="text-xl font-extrabold text-teal-800 dark:text-teal-300">
                      {doctorProfile?.fullName ? `Dr. ${doctorProfile.fullName}` : 'Dr. Doctor'}
                    </h1>
                    <p className="text-[11px] font-bold text-gray-500">{(doctorProfile?.degree || []).join(', ') || 'MBBS, FCPS'}</p>
                    {(doctorProfile?.specialization || []).length > 0 && (
                      <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{(doctorProfile.specialization || []).join(', ')}</p>
                    )}
                    {doctorProfile?.clinicName && (
                      <p className="text-[10px] text-gray-400">{doctorProfile.clinicName}</p>
                    )}
                    {doctorProfile?.clinicAddress && (
                      <p className="text-[10px] text-gray-400">{doctorProfile.clinicAddress}</p>
                    )}
                    {doctorProfile?.bmdcRegNo && (
                      <p className="text-[10px] text-gray-400">BMDC: {doctorProfile.bmdcRegNo}</p>
                    )}
                    {doctorProfile?.phone && (
                      <p className="text-[10px] text-gray-400">{doctorProfile.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {doctorProfile?.clinicLogo ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${doctorProfile.clinicLogo}`} alt="Clinic" className="w-14 h-14 object-contain ml-auto mb-2" />
                    ) : (
                      <div className="w-12 h-12 bg-teal-800 rounded-lg flex items-center justify-center text-white ml-auto mb-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </div>
                    )}
                    <p className="text-[7px] font-bold text-teal-800 dark:text-teal-300">Forwarded by PRESMANAGE</p>
                  </div>
                </div>
              </div>

              {/* Rx Content */}
              <div className="p-8 grid grid-cols-12 gap-8 text-[11px]">
                {/* Left Column - Patient Info */}
                <div className="col-span-4 border-r border-gray-100 dark:border-gray-700 pr-6 space-y-6">
                  {selectedPatient && (
                    <div>
                      <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-2">Patient Details</h4>
                      <p className="font-bold text-gray-900 dark:text-white truncate">{selectedPatient.fullName}</p>
                      <p className="text-gray-500">Age: {selectedPatient.age}Y | Sex: {selectedPatient.gender?.charAt(0)}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-2">Chief Complaint</h4>
                    {(watch('chiefComplaint') || '').split('\n').filter(Boolean).map((item, i) => (
                      <p key={i} className="text-gray-600 dark:text-gray-400">• {item}</p>
                    ))}
                    {!watch('chiefComplaint') && <p className="text-gray-600 dark:text-gray-400">—</p>}
                  </div>
                  {watch('symptoms') && (
                    <div>
                      <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-2">Symptoms</h4>
                      <p className="text-gray-600 dark:text-gray-400">{watch('symptoms')}</p>
                    </div>
                  )}
                  {(watch('bloodPressure') || watch('pulseRate')) && (
                    <div>
                      <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-2">Vitals</h4>
                      <p className="text-gray-600 dark:text-gray-400">BP: {watch('bloodPressure') || '—'} mmHg</p>
                      <p className="text-gray-600 dark:text-gray-400">HR: {watch('pulseRate') || '—'} bpm</p>
                    </div>
                  )}
                  {watch('diagnosis') && (
                    <div>
                      <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-2">Diagnosis</h4>
                      <p className="text-gray-600 dark:text-gray-400">{watch('diagnosis')}</p>
                    </div>
                  )}
                  <div className="pt-10">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR" className="w-[72px] h-[72px] block mb-1" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
                    )}
                    <p className="text-[8px] text-gray-300">Scan for e-validation</p>
                  </div>
                </div>

                {/* Right Column - Rx */}
                <div className="col-span-8 space-y-8">
                  <div className="flex items-center gap-4 text-teal-600 opacity-50">
                    <span className="text-4xl font-serif italic" style={{ fontFamily: 'serif' }}>Rx</span>
                    <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-700" />
                  </div>

                  <div className="space-y-6">
                    {medFields.filter((_, i) => watch(`medicines.${i}.name`)).length === 0 ? (
                      <p className="text-gray-400 italic">No medicines prescribed</p>
                    ) : (
                      medFields.map((field, i) => {
                        const m = watch(`medicines.${i}`);
                        if (!m.name) return null;
                        return (
                          <div key={field.id} className="relative pl-2 border-l-2 border-teal-300/50">
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{getForm(m.form)} {m.name}{m.strength ? ` ${m.strength}` : ''}{m.genericName ? ` (${m.genericName})` : ''}</p>
                            <p className="text-gray-500 text-[10px]">{m.dosage} · {m.frequency || '—'} · {fmtDur(m.duration)}</p>
                            {m.instructions && <p className="text-gray-400 text-[9px] mt-0.5 italic">{m.instructions}</p>}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {invs && invs.filter((_, i) => watch(`investigations.${i}.name`)).length > 0 && (
                    <div className="mt-10">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-[10px] mb-2 border-b border-gray-100 dark:border-gray-700 pb-1 uppercase tracking-widest">Investigations</h4>
                      {invs.filter((_, i) => watch(`investigations.${i}.name`)).map((_, i) => (
                        <p key={i} className="text-gray-600 dark:text-gray-400">• {watch(`investigations.${i}.name`)}</p>
                      ))}
                    </div>
                  )}

                  {watch('advice') && (
                    <div className="mt-8">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-[10px] mb-2 border-b border-gray-100 dark:border-gray-700 pb-1 uppercase tracking-widest">Advice</h4>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{watch('advice')}</p>
                    </div>
                  )}

                  {watch('foodAdvice') && (
                    <div className="mt-6">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-[10px] mb-2 border-b border-gray-100 dark:border-gray-700 pb-1 uppercase tracking-widest">Food Advice</h4>
                      <p className="text-gray-600 dark:text-gray-400">{watch('foodAdvice')}</p>
                    </div>
                  )}

                  {watch('followUpDate') && (
                    <div className="mt-6">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium"><span className="font-bold">Follow-up:</span> {formatFollowUp(watch('followUpDate')!)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature */}
              <div className="absolute bottom-12 right-12 text-center">
                {doctorProfile?.signatureImg ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${doctorProfile.signatureImg}`}
                    alt="Signature"
                    className="h-10 mx-auto mb-1 object-contain"
                  />
                ) : (
                  <div className="w-40 h-[1px] bg-gray-200 dark:bg-gray-700 mb-2 mx-auto" />
                )}
                <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 uppercase">
                  {doctorProfile?.fullName ? `Dr. ${doctorProfile.fullName}` : 'Dr. Doctor'}
                </p>
                {doctorProfile?.bmdcRegNo && (
                  <p className="text-[8px] text-gray-400">Reg No: {doctorProfile.bmdcRegNo}</p>
                )}
              </div>

              {/* Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 pointer-events-none opacity-[0.03] text-teal-900 select-none">
                <span className="text-8xl font-black">RX</span>
              </div>
            </div>
          </div>
        </aside>}
      </div>
      </div>

      {/* Validation Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Please fix the following errors:</p>
            <ul className="mt-1 text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-0.5">
              {(() => {
                const flat: string[] = [];
                const walk = (obj: any, prefix = '') => {
                  for (const [k, v] of Object.entries(obj || {})) {
                    if (v && typeof v === 'object' && 'message' in v) flat.push(v.message as string);
                    else if (v && typeof v === 'object') walk(v, `${prefix}${k}.`);
                  }
                };
                walk(errors);
                return flat.map((msg, i) => <li key={i}>{msg}</li>);
              })()}
            </ul>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-4 sm:bottom-8 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 z-50 flex items-center justify-center gap-1 sm:gap-2 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl rounded-2xl sm:rounded-full shadow-2xl p-2 border border-gray-200 dark:border-gray-800 overflow-x-auto">

        <button type="button" onClick={saveDraft} className="text-gray-600 dark:text-gray-300 px-3 sm:px-6 py-3 flex items-center gap-1 sm:gap-2 hover:scale-105 transition-transform active:scale-95 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          <span className="hidden sm:inline">Save</span><span> Draft</span>
        </button>
        <button type="button" onClick={clearDraft} className="text-red-500 dark:text-red-400 px-3 sm:px-6 py-3 flex items-center gap-1 sm:gap-2 hover:scale-105 transition-transform active:scale-95 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear
        </button>
        <button
          type="submit"
          disabled={create.isPending || !profileStatus.isVerified || !profileStatus.isProfileComplete || (subscription ? rxCount >= subscription.prescriptionLimit : false)}
          onClick={handleSubmit(onSubmit)}
          className="bg-teal-600 text-white rounded-full px-8 py-3 flex items-center gap-2 hover:scale-105 transition-transform active:scale-95 text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          {create.isPending ? 'Creating...' : subscription && rxCount >= subscription.prescriptionLimit ? 'Limit Reached' : 'Finalize & Send'}
        </button>
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-[#f7f9fb]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>}>
      <NewPrescriptionForm />
    </Suspense>
  );
}
