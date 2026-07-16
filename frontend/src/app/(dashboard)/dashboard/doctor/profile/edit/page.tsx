'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { DEGREES, SPECIALIZATIONS } from '@/lib/constants';
import { doctorProfileSchema, type DoctorProfileFormData } from '@/features/doctors/schema';
import {
  User, Phone, Award, Building2, DollarSign, Save, ArrowLeft,
  Image as ImageIcon, Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUploadUrl } from '@/lib/utils';

type Profile = Record<string, any>;

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signatureError, setSignatureError] = useState('');

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

  const onSubmit = async (data: DoctorProfileFormData) => {
    if (!profile?.signatureImg) {
      setSignatureError('Signature is required');
      return;
    }
    setSignatureError('');
    setSaving(true);
    try {
      await api.put('/doctors/profile', data);
      toast.success('Profile updated');
      router.push('/dashboard/doctor/profile');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
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
      setSignatureError('');
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/doctor/profile">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">Update your personal, professional, clinic, and fee information</p>
        </div>
      </div>

      <Card className="premium-card-static">
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            </div>

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

            {/* Brand Assets */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-sky-600" />
                Brand Assets
              </h4>
              <div className="grid grid-cols-3 gap-4 max-w-lg">
                {/* Profile Photo */}
                <div className="relative group/upload">
                  <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-1 overflow-hidden transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                    {profile?.profileImg ? (
                      <>
                        <img src={getUploadUrl(profile.profileImg)} alt="Profile" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Label htmlFor="edit-prof-img" className="cursor-pointer text-[10px] text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-white/30 transition-colors">
                            Change
                          </Label>
                          <button type="button" onClick={() => handleRemove('profile-img')} className="text-[10px] text-white bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-red-500 transition-colors">
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <label htmlFor="edit-prof-img" className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center pointer-events-none">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors pointer-events-none">
                          Upload
                        </span>
                      </label>
                    )}
                  </div>
                  <input id="edit-prof-img" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('profile-img', e.target.files?.[0] || null)} />
                  <p className="text-[11px] text-center text-muted-foreground mt-1.5">Profile Photo</p>
                </div>

                {/* Signature */}
                <div className="relative group/upload">
                  <div className={`aspect-square rounded-xl border-2 border-dashed bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-1 overflow-hidden transition-colors hover:border-gray-400 dark:hover:border-gray-500 ${signatureError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'}`}>
                    {profile?.signatureImg ? (
                      <>
                        <img src={getUploadUrl(profile.signatureImg)} alt="Signature" className="h-full w-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Label htmlFor="edit-sig" className="cursor-pointer text-[10px] text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-white/30 transition-colors">
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
                      <label htmlFor="edit-sig" className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center pointer-events-none">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors pointer-events-none">
                          Upload
                        </span>
                      </label>
                    )}
                  </div>
                  <input id="edit-sig" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('signature', e.target.files?.[0] || null)} />
                  <p className="text-[11px] text-center mt-1.5">Signature</p>
                  {signatureError && (
                    <p className="text-xs text-red-500 text-center">{signatureError}</p>
                  )}
                </div>

                {/* Clinic Logo */}
                <div className="relative group/upload">
                  <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-1 overflow-hidden transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                    {profile?.clinicLogo ? (
                      <>
                        <img src={getUploadUrl(profile.clinicLogo)} alt="Logo" className="h-full w-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Label htmlFor="edit-logo" className="cursor-pointer text-[10px] text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-white/30 transition-colors">
                            Change
                          </Label>
                          <button type="button" onClick={() => handleRemove('logo')} className="text-[10px] text-white bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-red-500 transition-colors">
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <label htmlFor="edit-logo" className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center pointer-events-none">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors pointer-events-none">
                          Upload
                        </span>
                      </label>
                    )}
                  </div>
                  <input id="edit-logo" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('logo', e.target.files?.[0] || null)} />
                  <p className="text-[11px] text-center text-muted-foreground mt-1.5">Clinic Logo</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving} className="h-11 flex-1 gradient-primary text-white shadow-glow hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/dashboard/doctor/profile" className="flex-1">
                <Button type="button" variant="outline" className="h-11 w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
