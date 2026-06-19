'use client';

import { useState, useEffect } from 'react';
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
import {
  User, Mail, Phone, Award, Stethoscope, Building2, MapPin,
  FileText, Clock, Save, Image as ImageIcon, Calendar, X, Plus, Pencil, CheckCircle, XCircle,
} from 'lucide-react';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

type Profile = Record<string, any>;
type Section = 'personal' | 'professional' | 'clinic' | null;

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<Section>(null);
  const [form, setForm] = useState<Profile>({});

  useEffect(() => {
    api.get('/doctors/profile').then((r) => {
      const p = r.data.data;
      let schedule = p.chamberSchedule;
      if (!schedule || typeof schedule === 'string') {
        try { schedule = JSON.parse(schedule || '[]'); } catch { schedule = []; }
      }
      setProfile({ ...p, chamberSchedule: schedule });
      initForm({ ...p, chamberSchedule: schedule });
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const initForm = (p: Profile) => {
    setForm({
      fullName: p.fullName || '',
      phone: p.phone || '',
      degree: Array.isArray(p.degree) ? p.degree : [],
      specialization: Array.isArray(p.specialization) ? p.specialization : [],
      bmdcRegNo: p.bmdcRegNo || '',
      clinicName: p.clinicName || '',
      clinicAddress: p.clinicAddress || '',
      chamberSchedule: p.chamberSchedule || [],
    });
  };

  const openSection = (section: Section) => {
    if (profile) initForm(profile);
    setEditingSection(section);
  };

  const cancelEdit = () => {
    if (profile) initForm(profile);
    setEditingSection(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/doctors/profile', form);
      let schedule = data.data.chamberSchedule;
      if (!schedule || typeof schedule === 'string') {
        try { schedule = JSON.parse(schedule || '[]'); } catch { schedule = []; }
      }
      setProfile({ ...data.data, chamberSchedule: schedule });
      setEditingSection(null);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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

  const updateSchedule = (idx: number, field: string, value: string) => {
    const s = [...(form.chamberSchedule || [])];
    s[idx] = { ...s[idx], [field]: value };
    setForm((f: any) => ({ ...f, chamberSchedule: s }));
  };

  const addSlot = () => {
    setForm((f: any) => ({ ...f, chamberSchedule: [...(f.chamberSchedule || []), { day: '', startTime: '', endTime: '' }] }));
  };

  const removeSlot = (idx: number) => {
    setForm((f: any) => ({ ...f, chamberSchedule: (f.chamberSchedule || []).filter((_: any, i: number) => i !== idx) }));
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
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="premium-card-static overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-gray-600 dark:text-gray-300">{initials}</span>
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
                {profile?.degree?.length > 0 && <span className="hidden sm:inline ml-1">· {profile?.degree?.join(', ')}</span>}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openSection('personal')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { section: 'personal' as const, icon: <User />, title: 'Personal', subtitle: 'Contact details', rows: () => (<>{infoRow(<Mail />, 'Email', profile?.user?.email)}{infoRow(<Phone />, 'Phone', profile?.phone)}</>) },
          { section: 'professional' as const, icon: <Award />, title: 'Professional', subtitle: 'Credentials & expertise', rows: () => (<>{infoRow(<Award />, 'Degree', (profile?.degree || []).join(', '))}{infoRow(<Stethoscope />, 'Specialization', (profile?.specialization || []).join(', '))}{infoRow(<FileText />, 'BMDC Reg No', profile?.bmdcRegNo)}</>) },
          { section: 'clinic' as const, icon: <Building2 />, title: 'Clinic', subtitle: 'Practice location', rows: () => (<>{infoRow(<Building2 />, 'Clinic Name', profile?.clinicName)}{infoRow(<MapPin />, 'Address', profile?.clinicAddress)}</>) },
        ].map((card) => (
          <Card key={card.section} className="premium-card-static group">
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
                <button onClick={() => openSection(card.section)} className="p-2 rounded-lg text-muted-foreground hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">{card.rows()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Schedule */}
        <Card className="premium-card-static">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Chamber Schedule</h3>
                  <p className="text-xs text-muted-foreground">Weekly availability</p>
                </div>
              </div>
              <button onClick={() => openSection('clinic')} className="p-2 rounded-lg text-muted-foreground hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            {profile?.chamberSchedule && profile.chamberSchedule.length > 0 ? (
              <div className="space-y-2">
                {profile.chamberSchedule.map((slot: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{slot.day}</p>
                        <p className="text-xs text-muted-foreground">{slot.startTime} — {slot.endTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No schedule set</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Assets */}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group/upload">
                <div className="aspect-[3/2] rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-2 overflow-hidden transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                  {profile?.signatureImg ? (
                    <>
                      <img src={`http://localhost:5000/uploads/${profile.signatureImg}`} alt="Signature" className="h-full w-full object-contain p-3" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                        <Label htmlFor="sig" className="cursor-pointer text-xs text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                          Change
                        </Label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Pencil className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Label htmlFor="sig" className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Upload Signature
                      </Label>
                    </>
                  )}
                </div>
                <input id="sig" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('signature', e.target.files?.[0] || null)} />
                <p className="text-xs text-center text-muted-foreground mt-2">Signature</p>
              </div>

              <div className="relative group/upload">
                <div className="aspect-[3/2] rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-2 overflow-hidden transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                  {profile?.clinicLogo ? (
                    <>
                      <img src={`http://localhost:5000/uploads/${profile.clinicLogo}`} alt="Logo" className="h-full w-full object-contain p-3" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                        <Label htmlFor="logo" className="cursor-pointer text-xs text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                          Change
                        </Label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Label htmlFor="logo" className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Upload Logo
                      </Label>
                    </>
                  )}
                </div>
                <input id="logo" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload('logo', e.target.files?.[0] || null)} />
                <p className="text-xs text-center text-muted-foreground mt-2">Clinic Logo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(v) => { if (!v) cancelEdit(); }}>
        <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection === 'personal' && 'Edit Personal Information'}
              {editingSection === 'professional' && 'Edit Professional Details'}
              {editingSection === 'clinic' && 'Edit Clinic Information'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingSection === 'personal' && 'Update your contact details'}
              {editingSection === 'professional' && 'Update your credentials'}
              {editingSection === 'clinic' && 'Update your practice information'}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {editingSection === 'personal' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11 premium-input" placeholder="Dr. John Doe" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 premium-input" placeholder="+880 1XXX-XXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input value={profile?.user?.email || ''} disabled className="h-11 premium-input bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
            )}

            {editingSection === 'professional' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MultiSelect label="Degree" options={DEGREES} value={form.degree || []} onChange={(v) => setForm({ ...form, degree: v })} placeholder="Select degrees..." />
                  <MultiSelect label="Specialization" options={SPECIALIZATIONS} value={form.specialization || []} onChange={(v) => setForm({ ...form, specialization: v })} placeholder="Select specializations..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">BMDC Reg No</Label>
                  <Input value={form.bmdcRegNo} onChange={(e) => setForm({ ...form, bmdcRegNo: e.target.value })} className="h-11 premium-input" placeholder="A-12345" />
                </div>
              </div>
            )}

            {editingSection === 'clinic' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Clinic Name</Label>
                  <Input value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} className="h-11 premium-input" placeholder="City Medical Center" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Chamber Address</Label>
                  <textarea value={form.clinicAddress} onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })} className="premium-input w-full rounded-xl border border-input bg-white dark:bg-gray-900 px-3 py-2.5 text-sm resize-none" rows={3} placeholder="123, Main Street, Dhaka" />
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Chamber Schedule</h4>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
                    </Button>
                  </div>
                  <div className="space-y-2.5">
                    {(form.chamberSchedule || []).map((slot: any, idx: number) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <select value={slot.day} onChange={(e) => updateSchedule(idx, 'day', e.target.value)} className="premium-input h-9 px-2.5 text-sm bg-white dark:bg-gray-900 sm:flex-1 rounded-lg">
                          <option value="">Select day</option>
                          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                          <input type="time" value={slot.startTime} onChange={(e) => updateSchedule(idx, 'startTime', e.target.value)} className="premium-input h-9 px-2.5 text-sm flex-1 rounded-lg" />
                          <span className="text-xs text-muted-foreground shrink-0">to</span>
                          <input type="time" value={slot.endTime} onChange={(e) => updateSchedule(idx, 'endTime', e.target.value)} className="premium-input h-9 px-2.5 text-sm flex-1 rounded-lg" />
                        </div>
                        <button type="button" onClick={() => removeSlot(idx)} className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
    </div>
  );
}