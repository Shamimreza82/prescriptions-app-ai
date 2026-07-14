'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { DEGREES, SPECIALIZATIONS } from '@/lib/constants';
import { doctorProfileSchema, chamberSlotSchema, type DoctorProfileFormData } from '@/features/doctors/schema';
import {
  User, Mail, Phone, Award, Stethoscope, Building2, MapPin,
  FileText, Clock, Save, Image as ImageIcon, Calendar, X, Plus, Pencil, CheckCircle, XCircle, DollarSign,
} from 'lucide-react';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

type Profile = Record<string, any>;

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<'profile' | 'schedule' | null>(null);

  const form = useForm<DoctorProfileFormData>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      degree: [],
      specialization: [],
      bmdcRegNo: '',
      clinicName: '',
      clinicAddress: '',
      chamberSchedule: [],
      feesNewVisit: '' as any,
      feesFollowUp: '' as any,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'chamberSchedule',
  });

  useEffect(() => {
    api.get('/doctors/profile').then((r) => {
      const p = r.data.data;
      let schedule = p.chamberSchedule;
      if (!schedule || typeof schedule === 'string') {
        try { schedule = JSON.parse(schedule || '[]'); } catch { schedule = []; }
      }
      setProfile({ ...p, chamberSchedule: schedule });
      form.reset({
        fullName: p.fullName || '',
        phone: p.phone || '',
        degree: Array.isArray(p.degree) ? p.degree : [],
        specialization: Array.isArray(p.specialization) ? p.specialization : [],
        bmdcRegNo: p.bmdcRegNo || '',
        clinicName: p.clinicName || '',
        clinicAddress: p.clinicAddress || '',
        chamberSchedule: schedule,
      feesNewVisit: p.feesNewVisit ?? '',
      feesFollowUp: p.feesFollowUp ?? '',
      });
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const openProfileDialog = () => {
    if (profile) {
      form.reset({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        degree: Array.isArray(profile.degree) ? profile.degree : [],
        specialization: Array.isArray(profile.specialization) ? profile.specialization : [],
        bmdcRegNo: profile.bmdcRegNo || '',
        clinicName: profile.clinicName || '',
        clinicAddress: profile.clinicAddress || '',
        chamberSchedule: profile.chamberSchedule || [],
        feesNewVisit: profile.feesNewVisit ?? '',
        feesFollowUp: profile.feesFollowUp ?? '',
      });
    }
    setDialog('profile');
  };

  const openScheduleDialog = () => {
    if (profile) {
      form.reset({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        degree: Array.isArray(profile.degree) ? profile.degree : [],
        specialization: Array.isArray(profile.specialization) ? profile.specialization : [],
        bmdcRegNo: profile.bmdcRegNo || '',
        clinicName: profile.clinicName || '',
        clinicAddress: profile.clinicAddress || '',
        chamberSchedule: profile.chamberSchedule || [],
        feesNewVisit: profile.feesNewVisit ?? '',
        feesFollowUp: profile.feesFollowUp ?? '',
      });
    }
    setDialog('schedule');
  };

  const cancelEdit = () => {
    if (profile) {
      form.reset({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        degree: Array.isArray(profile.degree) ? profile.degree : [],
        specialization: Array.isArray(profile.specialization) ? profile.specialization : [],
        bmdcRegNo: profile.bmdcRegNo || '',
        clinicName: profile.clinicName || '',
        clinicAddress: profile.clinicAddress || '',
        chamberSchedule: profile.chamberSchedule || [],
        feesNewVisit: profile.feesNewVisit ?? '',
        feesFollowUp: profile.feesFollowUp ?? '',
      });
    }
    form.clearErrors();
    setDialog(null);
  };

  const saveProfile = async (data: DoctorProfileFormData) => {
    setSaving(true);
    try {
      const res = await api.put('/doctors/profile', data);
      let schedule = res.data.data.chamberSchedule;
      if (!schedule || typeof schedule === 'string') {
        try { schedule = JSON.parse(schedule || '[]'); } catch { schedule = []; }
      }
      setProfile({ ...res.data.data, chamberSchedule: schedule });
      setDialog(null);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitProfile = (data: DoctorProfileFormData) => saveProfile(data);

  const onSubmitSchedule = (data: DoctorProfileFormData) => {
    if (data.chamberSchedule.length === 0) {
      form.setError('chamberSchedule', { message: 'Add at least one schedule slot' });
      return;
    }
    for (const [i, slot] of data.chamberSchedule.entries()) {
      const r = chamberSlotSchema.safeParse(slot);
      if (!r.success) {
        const err = r.error.errors[0];
        const path = `chamberSchedule.${i}.${err.path[0]}` as any;
        form.setError(path, { message: err.message });
        return;
      }
    }
    saveProfile(data);
  };

  const handleRemove = async (field: string) => {
    try {
      const { data } = await api.delete(`/doctors/remove-${field}`);
      setProfile((p: any) => ({ ...p, ...data.data }));
      toast.success('File removed');
    } catch {
      toast.error('Remove failed');
    }
  };

  const handleUpload = async (field: string, file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append(field, file);
    try {
      const { data } = await api.post(`/doctors/upload-${field}`, fd);
      setProfile((p: any) => ({ ...p, ...data.data }));
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  const addSlot = () => {
    append({ day: '', startTime: '', endTime: '' });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const initials = (profile?.fullName || '')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const infoRow = (icon: any, label: string, value: string) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
        <div className="h-4 w-4 text-gray-500">{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value || '\u2014'}</p>
      </div>
    </div>
  );

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="premium-card-static overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group/avatar w-16 h-16 shrink-0">
              {profile?.profileImg ? (
                <img src={`http://localhost:5000/uploads/${profile.profileImg}`} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-600 dark:text-gray-300">{initials}</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Label htmlFor="profile-img" className="cursor-pointer text-[10px] text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-white/30 transition-colors">
                  Change
                </Label>
                {profile?.profileImg && (
                  <button type="button" onClick={() => handleRemove('profile-img')} className="text-[10px] text-white bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-red-500 transition-colors">
                    Remove
                  </button>
                )}
              </div>
              <input id="profile-img" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('profile-img', e.target.files?.[0] || null)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{profile?.fullName || 'Doctor'}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {profile?.isVerified !== undefined && (
                    <Badge variant={profile.isVerified ? 'success' : 'warning'} className="text-xs">
                      {profile.isVerified ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {profile.isVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {(profile?.specialization || []).join(', ') || 'General Practitioner'}
                {profile?.degree?.length > 0 && <span className="hidden sm:inline ml-1">\u00B7 {profile?.degree?.join(', ')}</span>}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={openProfileDialog}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <User />, title: 'Personal', subtitle: 'Contact details', rows: () => (<>{infoRow(<Mail />, 'Email', profile?.user?.email)}{infoRow(<Phone />, 'Phone', profile?.phone)}</>) },
          { icon: <Award />, title: 'Professional', subtitle: 'Credentials & expertise', rows: () => (<>{infoRow(<Award />, 'Degree', (profile?.degree || []).join(', '))}{infoRow(<Stethoscope />, 'Specialization', (profile?.specialization || []).join(', '))}{infoRow(<FileText />, 'BMDC Reg No', profile?.bmdcRegNo)}</>) },
          { icon: <Building2 />, title: 'Clinic', subtitle: 'Practice location', rows: () => (<>{infoRow(<Building2 />, 'Clinic Name', profile?.clinicName)}{infoRow(<MapPin />, 'Address', profile?.clinicAddress)}</>) },
          { icon: <DollarSign />, title: 'Consultation Fees', subtitle: 'New & follow-up visit', rows: () => (<>{infoRow(<DollarSign />, 'New Visit', profile?.feesNewVisit ? `BDT ${profile.feesNewVisit}` : '\u2014')}{infoRow(<DollarSign />, 'Follow-up Visit', profile?.feesFollowUp ? `BDT ${profile.feesFollowUp}` : '\u2014')}</>) },
          { icon: <Calendar />, title: 'Schedule', subtitle: 'Chamber hours', rows: () => (
            <div className="space-y-2">
              {(profile?.chamberSchedule || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No schedule added</p>
              ) : (
                (profile?.chamberSchedule || []).map((slot: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{slot.day || '\u2014'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {slot.startTime && slot.endTime
                          ? `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
                          : '\u2014'}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" size="sm" onClick={openScheduleDialog} className="mt-2">
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Schedule
              </Button>
            </div>
          )},
        ].map((card) => (
          <Card key={card.title} className="premium-card-static group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="h-5 w-5 text-gray-600 dark:text-gray-300">{card.icon}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{card.title}</h3>
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">{card.rows()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid gap-5 md:grid-cols-1">
        <Card className="premium-card-static">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Brand Assets</h3>
                <p className="text-xs text-muted-foreground">Signature & clinic logo</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-lg">
              <div className="relative group/upload">
                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-1 overflow-hidden transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                  {profile?.profileImg ? (
                    <>
                      <img src={`http://localhost:5000/uploads/${profile.profileImg}`} alt="Profile" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Label htmlFor="prof-img" className="cursor-pointer text-[10px] text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-white/30 transition-colors">
                          Change
                        </Label>
                        <button type="button" onClick={() => handleRemove('profile-img')} className="text-[10px] text-white bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-red-500 transition-colors">
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <label htmlFor="prof-img" className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center pointer-events-none">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors pointer-events-none">
                        Upload
                      </span>
                    </label>
                  )}
                </div>
                <input id="prof-img" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('profile-img', e.target.files?.[0] || null)} />
                <p className="text-[11px] text-center text-muted-foreground mt-1.5">Profile Photo</p>
              </div>
              <div className="relative group/upload">
                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-1 overflow-hidden transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                  {profile?.signatureImg ? (
                    <>
                      <img src={`http://localhost:5000/uploads/${profile.signatureImg}`} alt="Signature" className="h-full w-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Label htmlFor="sig" className="cursor-pointer text-[10px] text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-white/30 transition-colors">
                          Change
                        </Label>
                        {(!profile?._count || profile._count.prescriptions === 0) && (
                          <button type="button" onClick={() => handleRemove('signature')} className="text-[10px] text-white bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-red-500 transition-colors">
                            Remove
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <label htmlFor="sig" className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center pointer-events-none">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors pointer-events-none">
                        Upload
                      </span>
                    </label>
                  )}
                </div>
                <input id="sig" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('signature', e.target.files?.[0] || null)} />
                <p className="text-[11px] text-center text-muted-foreground mt-1.5">Signature</p>
              </div>

              <div className="relative group/upload">
                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-1 overflow-hidden transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                  {profile?.clinicLogo ? (
                    <>
                      <img src={`http://localhost:5000/uploads/${profile.clinicLogo}`} alt="Logo" className="h-full w-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Label htmlFor="logo" className="cursor-pointer text-[10px] text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-white/30 transition-colors">
                          Change
                        </Label>
                        <button type="button" onClick={() => handleRemove('logo')} className="text-[10px] text-white bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-red-500 transition-colors">
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <label htmlFor="logo" className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center pointer-events-none">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors pointer-events-none">
                        Upload
                      </span>
                    </label>
                  )}
                </div>
                <input id="logo" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('logo', e.target.files?.[0] || null)} />
                <p className="text-[11px] text-center text-muted-foreground mt-1.5">Clinic Logo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Profile Edit Dialog */}
      <Dialog open={dialog === 'profile'} onOpenChange={(v) => { if (!v) cancelEdit(); }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <p className="text-sm text-muted-foreground">Update your personal, professional, clinic, and fee information</p>
          </DialogHeader>

          {Object.keys(form.formState.errors).length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3">
              <div className="text-sm font-semibold text-red-800 dark:text-red-300">
                Please fix the following errors:
                <ul className="mt-1 list-disc list-inside text-xs font-normal">
                  {Object.entries(form.formState.errors).map(([key, err]) => (
                    <li key={key}>{err?.message as string || key}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
            {/* Personal */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <Input {...form.register('fullName')} className="h-11 premium-input" placeholder="Dr. John Doe" />
                  {form.formState.errors.fullName && (
                    <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input {...form.register('phone')} className="h-11 premium-input" placeholder="+880 1XXX-XXXXXX" />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input value={profile?.user?.email || ''} disabled className="h-11 premium-input bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Professional */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                Professional Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <MultiSelect label="Degree" options={DEGREES} value={form.watch('degree')} onChange={(v) => form.setValue('degree', v, { shouldValidate: true })} placeholder="Select degrees..." />
                  {form.formState.errors.degree && (
                    <p className="text-xs text-red-500">{form.formState.errors.degree.message || 'At least one degree is required'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <MultiSelect label="Specialization" options={SPECIALIZATIONS} value={form.watch('specialization')} onChange={(v) => form.setValue('specialization', v, { shouldValidate: true })} placeholder="Select specializations..." />
                  {form.formState.errors.specialization && (
                    <p className="text-xs text-red-500">{form.formState.errors.specialization.message || 'At least one specialization is required'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">BMDC Reg No</Label>
                <Input {...form.register('bmdcRegNo')} className="h-11 premium-input" placeholder="A-12345" />
                {form.formState.errors.bmdcRegNo && (
                  <p className="text-xs text-red-500">{form.formState.errors.bmdcRegNo.message}</p>
                )}
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Clinic */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Clinic Information
              </h4>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Clinic Name</Label>
                <Input {...form.register('clinicName')} className="h-11 premium-input" placeholder="City Medical Center" />
                {form.formState.errors.clinicName && (
                  <p className="text-xs text-red-500">{form.formState.errors.clinicName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Chamber Address</Label>
                <textarea {...form.register('clinicAddress')} className="premium-input w-full rounded-xl border border-input bg-white dark:bg-gray-900 px-3 py-2.5 text-sm resize-none" rows={3} placeholder="123, Main Street, Dhaka" />
                {form.formState.errors.clinicAddress && (
                  <p className="text-xs text-red-500">{form.formState.errors.clinicAddress.message}</p>
                )}
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Fees */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
                Consultation Fees
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">New Visit Fee (BDT)</Label>
                  <Input type="number" min={0} {...form.register('feesNewVisit')} className="h-11 premium-input" placeholder="e.g. 500" />
                  {form.formState.errors.feesNewVisit && (
                    <p className="text-xs text-red-500">{form.formState.errors.feesNewVisit.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Follow-up Visit Fee (BDT)</Label>
                  <Input type="number" min={0} {...form.register('feesFollowUp')} className="h-11 premium-input" placeholder="e.g. 300" />
                  {form.formState.errors.feesFollowUp && (
                    <p className="text-xs text-red-500">{form.formState.errors.feesFollowUp.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving} className="h-11 flex-1 gradient-primary text-white shadow-glow hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} className="h-11">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Edit Dialog */}
      <Dialog open={dialog === 'schedule'} onOpenChange={(v) => { if (!v) cancelEdit(); }}>
        <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chamber Schedule</DialogTitle>
            <p className="text-sm text-muted-foreground">Set your weekly chamber hours</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmitSchedule)} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Schedule</h4>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
              </Button>
            </div>

            {(form.formState.errors.chamberSchedule as any)?.message && (
              <p className="text-xs text-red-500">{(form.formState.errors.chamberSchedule as any).message || 'Add at least one schedule slot'}</p>
            )}

            <div className="space-y-2.5">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="sm:flex-1">
                    <select {...form.register(`chamberSchedule.${idx}.day`)} className="premium-input h-9 px-2.5 text-sm bg-white dark:bg-gray-900 w-full rounded-lg">
                      <option value="">Select day</option>
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {(form.formState.errors.chamberSchedule as any)?.[idx]?.day && (
                      <p className="text-xs text-red-500 mt-0.5">{(form.formState.errors.chamberSchedule as any)[idx]?.day?.message as string}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <input type="time" {...form.register(`chamberSchedule.${idx}.startTime`)} className="premium-input h-9 px-2.5 text-sm flex-1 rounded-lg" />
                      {(form.formState.errors.chamberSchedule as any)?.[idx]?.startTime && (
                        <p className="text-xs text-red-500 mt-0.5">{(form.formState.errors.chamberSchedule as any)[idx]?.startTime?.message as string}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">to</span>
                    <div>
                      <input type="time" {...form.register(`chamberSchedule.${idx}.endTime`)} className="premium-input h-9 px-2.5 text-sm flex-1 rounded-lg" />
                      {(form.formState.errors.chamberSchedule as any)?.[idx]?.endTime && (
                        <p className="text-xs text-red-500 mt-0.5">{(form.formState.errors.chamberSchedule as any)[idx]?.endTime?.message as string}</p>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving} className="h-11 flex-1 gradient-primary text-white shadow-glow hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Schedule'}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} className="h-11">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
