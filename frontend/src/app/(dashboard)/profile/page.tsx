'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { DEGREES, SPECIALIZATIONS } from '@/lib/constants';
import { Camera, Upload, Clock, Plus, X } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/doctors/profile').then((r) => {
      const p = r.data.data;
      if (!p.chamberSchedule || typeof p.chamberSchedule === 'string') {
        try { p.chamberSchedule = JSON.parse(p.chamberSchedule || '[]'); } catch { p.chamberSchedule = []; }
      }
      setProfile(p);
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/doctors/profile', profile);
      toast.success('Profile updated');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  };

  const handleUpload = async (field: string, file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append(field, file);
    try {
      const { data } = await api.post(`/doctors/upload-${field}`, fd);
      setProfile((p: any) => ({ ...p, ...data.data }));
      toast.success('File uploaded');
    } catch { toast.error('Upload failed') }
  };

  const updateSchedule = (idx: number, field: string, value: string) => {
    const s = [...(profile.chamberSchedule || [])];
    s[idx] = { ...s[idx], [field]: value };
    setProfile((p: any) => ({ ...p, chamberSchedule: s }));
  };

  const addSlot = () => {
    setProfile((p: any) => ({ ...p, chamberSchedule: [...(p.chamberSchedule || []), { day: '', startTime: '', endTime: '' }] }));
  };

  const removeSlot = (idx: number) => {
    setProfile((p: any) => ({ ...p, chamberSchedule: (p.chamberSchedule || []).filter((_: any, i: number) => i !== idx) }));
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}</div>;

  const update = (field: string, value: any) => setProfile((p: any) => ({ ...p, [field]: value }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clinic & Chamber Profile</h1>
      <Card className="premium-card-static">
        <CardHeader><CardTitle>Clinic & Chamber Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile?.fullName || ''} onChange={(e) => update('fullName', e.target.value)} className="h-11 premium-input" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={profile?.phone || ''} onChange={(e) => update('phone', e.target.value)} className="h-11 premium-input" />
              </div>
              <MultiSelect
                label="Degree"
                options={DEGREES}
                value={Array.isArray(profile?.degree) ? profile.degree : []}
                onChange={(v) => update('degree', v)}
                placeholder="Select degrees..."
              />
              <MultiSelect
                label="Specialization"
                options={SPECIALIZATIONS}
                value={Array.isArray(profile?.specialization) ? profile.specialization : []}
                onChange={(v) => update('specialization', v)}
                placeholder="Select specializations..."
              />
              <div className="space-y-2">
                <Label>BMDC Reg No</Label>
                <Input value={profile?.bmdcRegNo || ''} onChange={(e) => update('bmdcRegNo', e.target.value)} className="h-11 premium-input" />
              </div>
              <div className="space-y-2">
                <Label>Clinic Name</Label>
                <Input value={profile?.clinicName || ''} onChange={(e) => update('clinicName', e.target.value)} className="h-11 premium-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Clinic Address</Label>
              <Textarea value={profile?.clinicAddress || ''} onChange={(e) => update('clinicAddress', e.target.value)} className="premium-input" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="border-2 border-dashed rounded-xl p-4 text-center">
                {profile?.signatureImg ? <img src={getUploadUrl(profile.signatureImg)} alt="Sig" className="h-16 mx-auto mb-2 object-contain" /> : <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
                <Label htmlFor="sig" className="cursor-pointer text-sm text-primary flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Signature
                </Label>
                <input id="sig" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('signature', e.target.files?.[0] || null)} />
              </div>
              <div className="border-2 border-dashed rounded-xl p-4 text-center">
                {profile?.clinicLogo ? <img src={getUploadUrl(profile.clinicLogo)} alt="Logo" className="h-16 mx-auto mb-2 object-contain" /> : <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
                <Label htmlFor="logo" className="cursor-pointer text-sm text-primary flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Logo
                </Label>
                <input id="logo" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('logo', e.target.files?.[0] || null)} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Chamber Schedule</h3>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                  <Plus className="h-4 w-4 mr-1" /> Add Slot
                </Button>
              </div>
              <div className="space-y-3">
                {(profile?.chamberSchedule || []).map((slot: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <select
                      value={slot.day}
                      onChange={(e) => updateSchedule(idx, 'day', e.target.value)}
                      className="premium-input h-10 px-3 text-sm bg-white dark:bg-gray-900 sm:flex-1"
                    >
                      <option value="">Select day</option>
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSchedule(idx, 'startTime', e.target.value)}
                        className="premium-input h-10 px-3 text-sm flex-1"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSchedule(idx, 'endTime', e.target.value)}
                        className="premium-input h-10 px-3 text-sm flex-1"
                      />
                    </div>
                    <button type="button" onClick={() => removeSlot(idx)} className="text-red-500 hover:text-red-600 p-1 self-end sm:self-center">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full h-11">{saving ? 'Saving...' : 'Save Profile'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
