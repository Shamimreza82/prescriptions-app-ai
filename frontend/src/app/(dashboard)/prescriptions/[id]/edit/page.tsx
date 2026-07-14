'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePrescription, useUpdatePrescription } from '@/features/prescriptions/hooks';
import { prescriptionSchema } from '@/features/prescriptions/schema';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/axios';
import { AlertTriangle, Plus, Trash2, Search, X, User, Pill, FlaskConical, Activity } from 'lucide-react';
import { useMedicineSearch, useLabTestSearch, useIndicationSearch } from '@/features/medicine/hooks';
import { formatFollowUp } from '@/lib/utils';
import { cn } from '@/lib/utils';
import QRCodeLib from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSidebar } from '@/contexts/sidebar-context';
import { DefaultTemplate } from '@/features/prescription-templates/templates/DefaultTemplate';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

type FormData = z.infer<typeof prescriptionSchema>;
const formAbbr: Record<string, string> = {
  'Tablet': 'TAB.', 'Capsule': 'CAP.', 'Injection': 'INJ.', 'Inject': 'INJ.',
  'Syrup': 'SYP.', 'Cream': 'CRM.', 'Ointment': 'OINT.', 'Gel': 'GEL.',
  'Drop': 'DROP.', 'Inhaler': 'INH.', 'Suspension': 'SUSP.', 'Solution': 'SOLN.',
  'Lotion': 'LOT.', 'Spray': 'SPRAY.', 'Powder': 'PDR.', 'Sachet': 'SACH.',
};
const getForm = (f?: string) => (f ? formAbbr[f] || f.toUpperCase() + '.' : '');
const fmtDur = (d?: string) => {
  if (!d) return '—';
  if (/continuous/i.test(d)) return d;
  if (/day/i.test(d)) return d;
  return `${d} Days`;
};

const emptyMedicine = { name: '', strength: '', form: '', dosage: '', frequency: '', duration: '', instructions: '' };

function EditPrescriptionForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: rx, isLoading: rxLoading } = usePrescription(id);
  const update = useUpdatePrescription(id);
  const { setIsCollapsed } = useSidebar();

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
  const [followUpPreset, setFollowUpPreset] = useState('');
  const [ccQuery, setCcQuery] = useState('');
  const [debouncedCcQuery, setDebouncedCcQuery] = useState('');
  const [showCcDropdown, setShowCcDropdown] = useState(false);
  const [ccItems, setCcItems] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const handleFollowUpPreset = (val: string) => {
    setFollowUpPreset(val);
    if (val) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(val));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setValue('followUpDate', `${yyyy}-${mm}-${dd}`, { shouldValidate: true });
    }
  };

  const medSearch = useMedicineSearch(debouncedMedQuery);
  const invSearch = useLabTestSearch(debouncedInvQuery);
  const ccSearch = useIndicationSearch(debouncedCcQuery);

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
      patientId: '', symptoms: '', chiefComplaint: '', diagnosis: '', diagnosisNotes: '',
      bloodPressure: '', pulseRate: '', temperature: '', oxygenSaturation: '',
      advice: '', foodAdvice: '', followUpDate: '',
      medicines: [emptyMedicine],
      investigations: [],
    },
  });

  const { fields: medFields, append: addMed, remove: removeMed, replace: replaceMeds } = useFieldArray({ control, name: 'medicines' });
  const { fields: invFields, append: addInv, remove: removeInv, replace: replaceInvs } = useFieldArray({ control, name: 'investigations' });

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (medDropdownRef.current && !medDropdownRef.current.contains(e.target as Node)) setActiveMedIndex(null);
      if (invDropdownRef.current && !invDropdownRef.current.contains(e.target as Node)) setShowInvDropdown(false);
      if (ccDropdownRef.current && !ccDropdownRef.current.contains(e.target as Node)) setShowCcDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    api.get('/patients?limit=100').then((r) => setPatients(r.data.data)).catch((e) => console.error(e));
    api.get('/doctors/profile').then((r) => {
      setDoctorProfile(r.data.data);
    }).catch((e) => console.error(e));
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    QRCodeLib.toDataURL(`${origin}/verify/preview`, { width: 120, margin: 1, color: { dark: '#111827', light: '#ffffff' } })
      .then(setQrDataUrl).catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (!rx) return;
    setValue('patientId', rx.patientId || '');
    setValue('symptoms', rx.symptoms || '');
    setValue('chiefComplaint', rx.chiefComplaint || '');
    setCcItems(rx.chiefComplaint ? rx.chiefComplaint.split('\n').filter(Boolean) : []);
    setValue('diagnosis', rx.diagnosis || '');
    setValue('diagnosisNotes', rx.diagnosisNotes || '');
    setValue('bloodPressure', rx.bloodPressure || '');
    setValue('pulseRate', rx.pulseRate || '');
    setValue('temperature', rx.temperature || '');
    setValue('oxygenSaturation', rx.oxygenSaturation || '');
    setValue('advice', rx.advice || '');
    setValue('foodAdvice', rx.foodAdvice || '');
    setValue('followUpDate', rx.followUpDate ? rx.followUpDate.split('T')[0] : '');
    if (rx.medicines?.length) {
      replaceMeds(rx.medicines.map((m: any) => ({
        name: m.name, genericName: m.genericName || '', strength: m.strength || '', form: m.form || '', dosage: m.dosage, frequency: m.frequency, duration: m.duration, instructions: m.instructions || '',
      })));
    }
    if (rx.investigations?.length) {
      replaceInvs(rx.investigations.map((i: any) => ({
        name: i.name, notes: i.notes || '',
      })));
    }
  }, [rx, setValue, replaceMeds, replaceInvs]);

  const watchPatientId = watch('patientId');
  useEffect(() => {
    if (watchPatientId && patients.length) {
      const p = patients.find((p: any) => p.id === watchPatientId);
      setSelectedPatient(p || null);
      if (p) setPatientSearch(p.fullName);
    }
  }, [watchPatientId, patients]);

  useEffect(() => {
    setIsCollapsed(showPreview);
  }, [showPreview, setIsCollapsed]);

  const onSubmit = async (data: FormData) => {
    try {
      await update.mutateAsync({
        ...data,
        followUpDate: data.followUpDate || undefined,
        investigations: data.investigations?.filter((i) => i.name),
      });
      toast.success('Prescription updated');
      router.push(`/prescriptions/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update prescription');
    }
  };

  const invs = watch('investigations');

  if (rxLoading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" type="button" onClick={() => router.push(`/prescriptions/${id}`)} className="rounded-xl">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Prescription</h1>
            <p className="text-sm text-gray-400">Update the prescription details</p>
          </div>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => setShowPreview(!showPreview)} className="text-xs font-bold text-teal-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          {showPreview ? 'Hide' : 'Show'} Preview
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* LEFT SIDE: Form */}
        <div className={cn("col-span-12 space-y-6", showPreview ? "lg:col-span-6" : "lg:col-span-12")}>

          {/* Patient Selection */}
          <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-400 border border-blue-200/30 dark:border-blue-800/30">
            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><span className="w-1.5 h-5 bg-blue-500 rounded-full" />Patient <span className="text-red-500">*</span></Label>
            {errors.patientId && <p className="text-xs text-red-500 mb-2">{errors.patientId.message as string}</p>}
            {watchPatientId && selectedPatient ? (
              <div className={cn("flex items-center gap-5", errors.patientId ? "p-3 rounded-xl ring-2 ring-red-500" : "")}>
                <div className="w-16 h-16 rounded-full gradient-primary shadow-glow flex items-center justify-center text-white font-bold text-2xl shrink-0">
                  {selectedPatient.fullName?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-gray-900 dark:text-white font-headline leading-tight">{selectedPatient.fullName}</h2>
                  <div className="flex items-center gap-3 mt-1 text-gray-500 dark:text-gray-400 font-medium text-sm">
                    <span>{selectedPatient.gender?.charAt(0) || '?'}, {selectedPatient.age || '?'} Years</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>Wt: {selectedPatient.weight || '—'}kg</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>ID: {selectedPatient.patientId || '—'}</span>
                    {selectedPatient.phone && <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span>{selectedPatient.phone}</span></>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" type="button" onClick={() => { setValue('patientId', ''); setSelectedPatient(null); setPatientSearch(''); }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className={cn("relative rounded-xl", errors.patientId ? "ring-2 ring-red-500" : "")}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search Patient (Name, ID or Mobile)..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setShowPatientResults(true); }}
                  onFocus={() => setShowPatientResults(true)}
                  className="bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none placeholder:text-gray-400"
                />
                {showPatientResults && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPatientResults(false)} />
                    <div className="absolute top-full mt-1 left-0 right-0 z-20 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl animate-fade-in">
                      {patients.filter((p: any) =>
                        !patientSearch || p.fullName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                        p.patientId?.toLowerCase().includes(patientSearch.toLowerCase()) || (p.phone && p.phone.includes(patientSearch))
                      ).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No patients found</p>
                      ) : (
                        patients.filter((p: any) =>
                          !patientSearch || p.fullName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                          p.patientId?.toLowerCase().includes(patientSearch.toLowerCase()) || (p.phone && p.phone.includes(patientSearch))
                        ).map((p: any) => (
                          <button key={p.id} type="button"
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
          </section>

          {/* Clinical Section */}
          <Card className="premium-card border-l-4 border-l-teal-400">
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  Chief Complaint / প্রধান সমস্যা
                  <span className="text-[10px] text-gray-400 font-normal">CC</span>
                </Label>
              </div>
              <div className="relative" ref={ccDropdownRef}>
                {ccItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ccItems.map((item, i) => (
                      <span key={i} className="bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-lg text-xs font-bold border border-teal-100 dark:border-teal-800 flex items-center gap-1">
                        {item}
                        <Button variant="ghost" size="icon" type="button" onClick={() => removeCcItem(i)} className="h-auto w-auto p-0 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </Button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  value={ccQuery}
                  onChange={(e) => handleCcInputChange(e.target.value)}
                  onFocus={() => ccQuery.length >= 2 && setShowCcDropdown(true)}
                  onKeyDown={handleCcKeyDown}
                  className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none shadow-sm"
                  placeholder="Type a chief complaint and press Enter or select from suggestions..."
                />
                {showCcDropdown && ccQuery.length >= 2 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl">
                    {ccSearch.isLoading ? (
                      <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
                    ) : !ccSearch.data || ccSearch.data.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No results found</p>
                    ) : (
                      ccSearch.data.map((ind: any) => (
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
                  <Label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    Diagnosis / রোগ নির্ণয়
                  </Label>
                </div>
                <textarea
                  {...register('diagnosis')}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none min-h-[60px] shadow-sm resize-none"
                  placeholder="Enter diagnosis..."
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-gray-800 dark:text-gray-200">Vitals / ভাইটালস</Label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">BP</p>
                  <Input {...register('bloodPressure')} placeholder="120/80" className="bg-transparent text-center font-bold text-teal-800 dark:text-teal-300 text-sm outline-none border-0 shadow-none p-0 h-auto" />
                </div>
                <div className="bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Pulse</p>
                  <div className="flex items-center justify-center">
                    <Input {...register('pulseRate')} placeholder="72" className="w-12 bg-transparent text-center font-bold text-teal-800 dark:text-teal-300 text-sm outline-none border-0 shadow-none p-0 h-auto" />
                    <span className="text-[10px] text-gray-400 font-normal ml-0.5">bpm</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">SpO2</p>
                  <div className="flex items-center justify-center">
                    <Input {...register('oxygenSaturation')} placeholder="98" className="w-10 bg-transparent text-center font-bold text-teal-800 dark:text-teal-300 text-sm outline-none border-0 shadow-none p-0 h-auto" />
                    <span className="text-[10px] text-gray-400 font-normal">%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input {...register('temperature')} placeholder="Temp (°F)" className="flex-1 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-full px-4 py-2 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none" />
                <Input {...register('symptoms')} placeholder="Symptom (জ্বর, কাশি)..." className="flex-[2] bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-full px-4 py-2 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none" />
              </div>
            </div>
          </div>
          </CardContent>
          </Card>

          {/* Medicine Entry */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 border-l-4 border-l-teal-500 border border-teal-200/50 dark:border-teal-800/50 shadow-lg relative">
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
                <div key={field.id} className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-2.5 sm:p-3 space-y-2 border border-gray-100 dark:border-gray-700/50">
                <div className="grid grid-cols-12 gap-2 sm:gap-3 items-start">
                  <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Medicine <span className="text-red-500">*</span></Label>
                    <div className="relative" ref={activeMedIndex === i ? medDropdownRef : undefined}>
                      <Input
                        value={activeMedIndex === i ? medQuery : watch(`medicines.${i}.name`)}
                        onChange={(e) => handleMedInputChange(i, e.target.value)}
                        onFocus={() => { setActiveMedIndex(i); setMedQuery(watch(`medicines.${i}.name`)); }}
                        placeholder="Type Brand or Generic name..."
                        className={cn("bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none", errors.medicines?.[i]?.name && 'border-red-500')}
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
                              {medSearch.data?.brands.slice(0, 5).map((b: any) => (
                                <button key={`brand-${b.id}`} type="button" onClick={() => selectMedicine(i, b.name, b.strength, b.form, b.generic?.name)}
                                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                                >
                                  <Pill className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{b.name} <span className="text-xs font-normal text-gray-500">{b.strength}</span></p>
                                    <p className="text-xs text-gray-400 truncate">{b.company?.name} · {b.form}</p>
                                  </div>
                                </button>
                              ))}
                              {medSearch.data?.generics.slice(0, 5).map((g: any) => (
                                <button key={`generic-${g.id}`} type="button" onClick={() => selectMedicine(i, g.name)}
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
                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Strength <span className="text-red-500">*</span></Label>
                    <Input {...register(`medicines.${i}.strength`)} placeholder="665mg" className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none text-center font-semibold" />
                  </div>
                  <div className="col-span-12 sm:col-span-4 md:col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Dose <span className="text-red-500">*</span></Label>
                    <Input list={`dosage-suggestions-${i}`} {...register(`medicines.${i}.dosage`)} placeholder="1+0+1" className={cn("bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none text-center font-bold tracking-widest", errors.medicines?.[i]?.dosage && 'border-red-500')} />
                    <datalist id={`dosage-suggestions-${i}`}>
                      <option value="1+0+0" /><option value="0+0+1" /><option value="1+0+1" /><option value="1+1+0" />
                      <option value="½+0+½" /><option value="1+1+1" /><option value="1½+0+1½" /><option value="2+0+2" />
                      <option value="1+1+½" /><option value="½+½+½" /><option value="1+0+½" /><option value="2+0+0" />
                      <option value="0+0+2" /><option value="1+0+0+1" />
                    </datalist>
                    {errors.medicines?.[i]?.dosage && <p className="text-xs text-red-500">{errors.medicines[i]?.dosage?.message}</p>}
                  </div>
                  <div className="col-span-12 sm:col-span-4 md:col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Freq</Label>
                    <Input list={`freq-suggestions-${i}`} {...register(`medicines.${i}.frequency`)} placeholder="সকাল + রাত" className={cn("bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none", errors.medicines?.[i]?.frequency && 'border-red-500')} />
                    <datalist id={`freq-suggestions-${i}`}>
                      <option value="OD (Once daily / দৈনিক ১ বার)" />
                      <option value="BD (Twice daily / দৈনিক ২ বার)" />
                      <option value="TDS (Three times daily / দৈনিক ৩ বার)" />
                      <option value="QID (Four times daily / দৈনিক ৪ বার)" />
                      <option value="HS (At bedtime / রাত্রে)" />
                      <option value="PRN (As needed / প্রয়োজন মত)" />
                      <option value="Stat (Immediately)" />
                      <option value="সকাল" /><option value="দুপুর" /><option value="রাত" />
                      <option value="সকাল + দুপুর" /><option value="সকাল + রাত" /><option value="দুপুর + রাত" />
                      <option value="সকাল + দুপুর + রাত" />
                      <option value="সকাল ১+০+০" /><option value="০+০+রাত ১" />
                      <option value="সকাল ১+০+রাত ১" /><option value="সকাল ১+দুপুর ১+রাত ১" />
                      <option value="প্রতি ২ ঘণ্টা" /><option value="প্রতি ৪ ঘণ্টা" />
                      <option value="প্রতি ৬ ঘণ্টা" /><option value="প্রতি ৮ ঘণ্টা" />
                      <option value="প্রতি ১২ ঘণ্টা" /><option value="প্রতি ২৪ ঘণ্টা" />
                      <option value="৫ বার দৈনিক" /><option value="৬ বার দৈনিক" />
                      <option value="একদিন অন্তর (Alternate day)" />
                      <option value="সপ্তাহে ১ বার (Once a week)" /><option value="সপ্তাহে ২ বার (Twice a week)" />
                      <option value="রাত্রে শোবার আগে (Before bedtime)" />
                      <option value="খালি পেটে (Empty stomach)" />
                      <option value="খাবারের আগে (Before meals)" />
                      <option value="খাবারের পর (After meals)" />
                      <option value="খাবারের সাথে (With meals)" />
                      <option value="Continuous / চলমান" />
                    </datalist>
                    {errors.medicines?.[i]?.frequency && <p className="text-xs text-red-500">{errors.medicines[i]?.frequency?.message}</p>}
                  </div>
                  <div className="col-span-6 sm:col-span-3 md:col-span-1 space-y-1.5">
                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Days <span className="text-red-500">*</span></Label>
                    <Input list={`duration-suggestions-${i}`} {...register(`medicines.${i}.duration`)} placeholder="7" className={cn("bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none text-center font-bold", errors.medicines?.[i]?.duration && 'border-red-500')} />
                    <datalist id={`duration-suggestions-${i}`}>
                      <option value="3 Days" /><option value="5 Days" /><option value="7 Days" /><option value="10 Days" />
                      <option value="14 Days" /><option value="21 Days" /><option value="30 Days" /><option value="45 Days" />
                      <option value="60 Days" /><option value="90 Days" />
                      <option value="Continuous / চলমান" />
                    </datalist>
                    {errors.medicines?.[i]?.duration && <p className="text-xs text-red-500">{errors.medicines[i]?.duration?.message}</p>}
                  </div>
                  <div className="col-span-6 sm:col-span-3 md:col-span-1 flex items-end justify-end pt-1.5">
                    {medFields.length > 1 && (
                      <Button variant="ghost" size="icon" type="button" onClick={() => removeMed(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Instructions / নির্দেশনা</Label>
                  <textarea {...register(`medicines.${i}.instructions`)} placeholder="e.g. Before meal, Avoid dairy..." rows={2} className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none resize-none" />
                </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-6">
              <Button type="button" onClick={() => addMed(emptyMedicine)} className="flex-1 bg-teal-600 text-white font-bold h-[46px] rounded-xl shadow-md shadow-teal-600/20 hover:scale-[1.01] transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm">
                <Plus className="w-5 h-5" /> Add to Prescription
              </Button>
            </div>
          </section>

          {/* Investigations */}
          <div className="space-y-4 pl-3 border-l-4 border-l-purple-400">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-purple-500 rounded-full" />
                Investigations / ল্যাব টেস্ট
                <span className="text-[10px] text-gray-400 font-normal">Lab</span>
              </Label>
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
                        <Button variant="ghost" size="icon" type="button" onClick={() => removeInv(i)} className="h-auto w-auto p-0 hover:text-red-500"><X className="w-3 h-3" /></Button>
                      </span>
                    );
                  })}
                </div>
              )}
              <Input
                id="inv-input"
                value={invQuery}
                onChange={(e) => handleInvInputChange(e.target.value)}
                onFocus={() => invQuery.length >= 2 && setShowInvDropdown(true)}
                onKeyDown={handleInvKeyDown}
                className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none shadow-sm"
                placeholder="Type a test name and press Enter or select from suggestions..."
              />
              {showInvDropdown && invQuery.length >= 2 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-xl">
                  {invSearch.isLoading ? (
                    <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
                  ) : invSearch.data?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No tests found</p>
                  ) : (
                    invSearch.data?.map((t: any) => (
                      <button key={t.id} type="button" onClick={() => selectLabTest(t.name)}
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

          {/* Advice & Follow-up */}
          <Card className="premium-card border-l-4 border-l-emerald-400">
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label className="text-sm font-bold text-gray-800 dark:text-gray-200">Lifestyle Advice / পরামর্শ</Label>
              <textarea {...register('advice')} className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none min-h-[80px] shadow-sm resize-none" placeholder="e.g. Walk 30 mins daily, Low salt diet..." />
            </div>
            <div className="space-y-4">
              <Label className="text-sm font-bold text-gray-800 dark:text-gray-200">Food Advice / খাদ্য</Label>
              <textarea {...register('foodAdvice')} className="w-full bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none min-h-[60px] shadow-sm resize-none" placeholder="Dietary recommendations..." />
              <Label className="text-sm font-bold text-gray-800 dark:text-gray-200">Follow-up / পুনরায়</Label>
              <div className="flex gap-2">
                <Select value={followUpPreset} onValueChange={handleFollowUpPreset}>
                  <SelectTrigger className="w-1/2">
                    <SelectValue placeholder="Quick select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="2">2 Days</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">1 Month</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" {...register('followUpDate')}
                  onChange={(e) => { setFollowUpPreset(''); register('followUpDate').onChange(e); }}
                  className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
                />
              </div>
            </div>
          </div>
          </CardContent>
          </Card>

        </div>

        {/* RIGHT SIDE: Live Preview Panel */}
        {showPreview && <aside className="col-span-12 lg:col-span-6">
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

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
              <DefaultTemplate
                prescription={{
                  ...watch(),
                  id: 'preview',
                  doctorId: doctorProfile?.id || '',
                  patientId: watch('patientId') || '',
                  prescriptionNo: 'Preview',
                  createdAt: new Date().toISOString(),
                  doctor: doctorProfile,
                  patient: selectedPatient || watch().patientId,
                  medicines: (watch('medicines') || []).filter((m: any) => m.name),
                  investigations: (watch('investigations') || []).filter((i: any) => i.name),
                }}
                qrDataUrl={qrDataUrl}
                blankPrint={false}
              />
            </div>
          </div>
        </aside>}
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
        <Button
          type="submit"
          disabled={update.isPending}
          onClick={handleSubmit(onSubmit)}
          className="bg-teal-600 text-white rounded-full px-8 py-3 flex items-center gap-2 hover:scale-105 transition-transform active:scale-95 text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          {update.isPending ? 'Updating...' : 'Update Prescription'}
        </Button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-[#f7f9fb]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>}>
      <EditPrescriptionForm />
    </Suspense>
  );
}
