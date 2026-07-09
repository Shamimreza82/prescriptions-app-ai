'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRecAppointments, useCreateRecAppointment, useUpdateRecAppointment } from '@/features/receptionist/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, Calendar, CheckCircle, XCircle, Eye, Search, X, Filter, DollarSign, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

const statusStyles: Record<string, string> = {
  SCHEDULED: 'badge-gradient-blue',
  COMPLETED: 'badge-gradient-green',
  CANCELLED: 'badge-gradient-purple',
  NO_SHOW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export default function RecAppointmentsPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ id: string; top: number; right: number } | null>(null);
  const [newApt, setNewApt] = useState({ patientId: '', date: '', time: '', fee: '', paymentMethod: '', notes: '' });
  const [editApt, setEditApt] = useState<{ id: string; date: string; time: string; fee: string; paymentMethod: string; paymentStatus: string; notes: string } | null>(null);

  const params: Record<string, string> = { page: String(page), limit: '15' };
  if (statusFilter !== 'ALL') params.status = statusFilter;
  if (search) params.search = search;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  const { data, isLoading } = useRecAppointments(params);
  const createApt = useCreateRecAppointment();
  const updateApt = useUpdateRecAppointment();

  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const { data: patients } = useQuery({
    queryKey: ['rec-patients-for-apt', patientSearch],
    queryFn: () => api.get('/receptionist/patients', { params: { limit: '20', search: patientSearch } }).then((r) => r.data.data),
    enabled: open,
  });

  const { data: doctorProfile } = useQuery({
    queryKey: ['rec-doctor-profile'],
    queryFn: () => api.get('/receptionist/doctor').then((r) => r.data.data),
    enabled: open,
  });

  const selectedPatient = patients?.find((p: any) => p.id === newApt.patientId) ?? null;
  const isFollowUp = selectedPatient?._count?.appointments > 0;
  const defaultFee = isFollowUp ? doctorProfile?.feesFollowUp : doctorProfile?.feesNewVisit;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createApt.mutateAsync({
        patientId: newApt.patientId,
        date: newApt.date,
        time: newApt.time,
        fee: newApt.fee ? Number(newApt.fee) : undefined,
        paymentStatus: newApt.fee && newApt.paymentMethod ? 'PAID' : 'UNPAID',
        paymentMethod: newApt.paymentMethod || undefined,
        notes: newApt.notes,
      });
      setOpen(false);
      setNewApt({ patientId: '', date: '', time: '', fee: '', paymentMethod: '', notes: '' });
      setPatientSearch('');
    } catch {}
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('ALL');
    setPage(1);
  };

  const hasFilters = search || dateFrom || dateTo || statusFilter !== 'ALL';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the clinic schedule</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 rounded-xl gradient-primary hover:opacity-90 text-white shadow-glow">
              <Plus className="h-4 w-4 mr-2" />New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Schedule Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2 relative">
                <Label>Patient <span className="text-red-500">*</span></Label>
                {newApt.patientId && patients ? (
                  <div className="flex items-center justify-between h-11 px-4 rounded-xl border border-input bg-white dark:bg-gray-900 text-sm">
                    <span className="font-medium">{(patients.find((p: any) => p.id === newApt.patientId) as any)?.fullName}</span>
                    <button type="button" onClick={() => setNewApt({ ...newApt, patientId: '' })} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, phone or ID..."
                      value={patientSearch}
                      onChange={(e) => { setPatientSearch(e.target.value); setShowPatientResults(true); }}
                      onFocus={() => setShowPatientResults(true)}
                      className="pl-10 h-11 rounded-xl"
                      autoComplete="off"
                    />
                    {showPatientResults && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPatientResults(false)} />
                        <div className="absolute top-full mt-1 left-0 right-0 z-20 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong animate-scale-in">
                          {patients?.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No patients found</p>
                          ) : (
                            patients?.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const isFollow = p._count?.appointments > 0;
                                  const fee = isFollow ? (doctorProfile?.feesFollowUp || '') : (doctorProfile?.feesNewVisit || '');
                                  setNewApt({ ...newApt, patientId: p.id, fee: String(fee) });
                                  setPatientSearch(p.fullName);
                                  setShowPatientResults(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                              >
                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.fullName}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {p.patientId}
                                    {p.phone ? ` · ${p.phone}` : ''}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apt-date">Date <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input id="apt-date" type="date" value={newApt.date} onChange={(e) => setNewApt({ ...newApt, date: e.target.value })} required className="pl-10 h-11 rounded-xl cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-time">Time <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input id="apt-time" type="time" value={newApt.time} onChange={(e) => setNewApt({ ...newApt, time: e.target.value })} required className="pl-10 h-11 rounded-xl cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800/50 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" /> Payment
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Consultation Fee</Label>
                    <div className="h-11 px-3 rounded-xl border border-input bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                      {newApt.patientId ? (
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            BDT {newApt.fee || '0'}
                          </span>
                          {selectedPatient && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              isFollowUp
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {isFollowUp ? 'Follow-up' : 'New Visit'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Select a patient</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={newApt.paymentMethod}
                      onValueChange={(v) => setNewApt({ ...newApt, paymentMethod: v })}
                      disabled={!newApt.fee}
                    >
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="BKASH">bKash</SelectItem>
                        <SelectItem value="NAGAD">Nagad</SelectItem>
                        <SelectItem value="ROCKET">Rocket</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea value={newApt.notes} onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })} className="premium-input w-full rounded-xl border border-input bg-white dark:bg-gray-900 px-3 py-2.5 text-sm resize-none" rows={3} placeholder="Add any notes..." />
              </div>
              <Button type="submit" disabled={createApt.isPending || !newApt.patientId} className="w-full rounded-xl gradient-primary text-white">
                {createApt.isPending ? 'Scheduling...' : 'Schedule'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Appointment Dialog */}
      <Dialog open={!!editApt} onOpenChange={(v) => { if (!v) setEditApt(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Appointment</DialogTitle>
          </DialogHeader>
          {editApt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input id="edit-date" type="date" value={editApt.date} onChange={(e) => setEditApt({ ...editApt, date: e.target.value })} className="pl-10 h-11 rounded-xl cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input id="edit-time" type="time" value={editApt.time} onChange={(e) => setEditApt({ ...editApt, time: e.target.value })} className="pl-10 h-11 rounded-xl cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800/50 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" /> Payment
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Consultation Fee</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" step="0.01" min="0" placeholder="0.00" value={editApt.fee} onChange={(e) => setEditApt({ ...editApt, fee: e.target.value })} className="pl-9 rounded-xl h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={editApt.paymentMethod} onValueChange={(v) => setEditApt({ ...editApt, paymentMethod: v })}>
                      <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="BKASH">bKash</SelectItem>
                        <SelectItem value="NAGAD">Nagad</SelectItem>
                        <SelectItem value="ROCKET">Rocket</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Payment Status</Label>
                  <Select value={editApt.paymentStatus} onValueChange={(v) => setEditApt({ ...editApt, paymentStatus: v })}>
                    <SelectTrigger className="rounded-xl h-11 mt-1.5"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea value={editApt.notes} onChange={(e) => setEditApt({ ...editApt, notes: e.target.value })} className="premium-input w-full rounded-xl border border-input bg-white dark:bg-gray-900 px-3 py-2.5 text-sm resize-none" rows={3} placeholder="Add any notes..." />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  className="flex-1 rounded-xl gradient-primary text-white shadow-glow"
                  disabled={updateApt.isPending}
                  onClick={() => {
                    updateApt.mutate({
                      id: editApt.id,
                      data: {
                        date: editApt.date || undefined,
                        time: editApt.time || undefined,
                        fee: editApt.fee ? Number(editApt.fee) : undefined,
                        paymentStatus: editApt.fee && editApt.paymentMethod ? 'PAID' : (editApt.paymentStatus || 'UNPAID'),
                        paymentMethod: editApt.paymentMethod || undefined,
                        notes: editApt.notes || undefined,
                      },
                    }, { onSuccess: () => setEditApt(null) });
                  }}
                >
                  {updateApt.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditApt(null)} className="flex-1 rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search & Filters */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-10 premium-input"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-700 flex items-center gap-2 transition-all"
            >
              <Filter className="h-4 w-4" />
              {dateFrom || dateTo ? 'Date: Set' : 'Date Filter'}
            </button>
            {showFilters && (
              <div className="absolute top-full mt-2 right-0 z-30 p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9 premium-input text-sm w-36" />
                  </div>
                  <span className="text-muted-foreground mt-5">—</span>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9 premium-input text-sm w-36" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-10 rounded-xl text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="NO_SHOW">No Show</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 shrink-0 text-muted-foreground">
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <Card className="premium-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {hasFilters ? 'No matching appointments' : 'No appointments'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {hasFilters ? 'Try adjusting your search or filters' : 'Schedule the first appointment'}
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              ) : (
                <Button variant="outline" onClick={() => setOpen(true)}>Schedule Appointment</Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Patient ID</th>
                      <th>Phone</th>
                      <th>Visit</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Notes</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.map((apt: any) => (
                      <tr key={apt.id}>
                        <td className="font-medium text-gray-900 dark:text-white">{apt.patient?.fullName}</td>
                        <td className="font-mono text-xs text-muted-foreground">{apt.patient?.patientId || '—'}</td>
                        <td className="text-muted-foreground">{apt.patient?.phone || '—'}</td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            apt.patient?._count?.appointments > 1
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {apt.patient?._count?.appointments > 1 ? 'Follow-up' : 'New'}
                          </span>
                        </td>
                        <td>{new Date(apt.date).toLocaleDateString()}</td>
                        <td className="font-mono text-sm">{apt.time}</td>
                        <td><span className={statusStyles[apt.status] || 'badge-gradient-blue'}>{apt.status}</span></td>
                        <td>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            apt.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                          }`}>
                            {apt.paymentStatus === 'PAID' ? `${apt.fee?.toFixed(2) || 'Paid'}` : 'Unpaid'}
                          </span>
                        </td>
                        <td className="text-muted-foreground max-w-[120px] truncate">{apt.notes || '-'}</td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              const rect = (e.target as HTMLElement).closest('button')!.getBoundingClientRect();
                              setMenuTarget(menuTarget?.id === apt.id ? null : { id: apt.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
                <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      {menuTarget && data?.data && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuTarget(null)} />
          <div
            className="fixed z-50 w-48 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong py-1.5 animate-scale-in"
            style={{ top: menuTarget.top, right: menuTarget.right }}
          >
            {(() => {
              const apt = data.data.find((a: any) => a.id === menuTarget.id);
              if (!apt) return null;
              return (
                <>
                  <Link href={`/dashboard/receptionist/appointments/${apt.id}`} onClick={() => setMenuTarget(null)}>
                    <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <Eye className="h-4 w-4 text-blue-500" /> View Details
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      setEditApt({
                        id: apt.id,
                        date: apt.date ? apt.date.split('T')[0] : '',
                        time: apt.time || '',
                        fee: apt.fee ? String(apt.fee) : '',
                        paymentMethod: apt.paymentMethod || '',
                        paymentStatus: apt.paymentStatus || 'UNPAID',
                        notes: apt.notes || '',
                      });
                      setMenuTarget(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit Appointment
                  </button>
                  {apt.status === 'SCHEDULED' && (
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                      <button
                        onClick={() => { updateApt.mutate({ id: apt.id, data: { status: 'COMPLETED' } }); setMenuTarget(null); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-500" /> Mark Completed
                      </button>
                      <button
                        onClick={() => { updateApt.mutate({ id: apt.id, data: { status: 'CANCELLED' } }); setMenuTarget(null); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <XCircle className="h-4 w-4 text-red-500" /> Cancel Appointment
                      </button>
                    </>
                  )}
                  {apt.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => { updateApt.mutate({ id: apt.id, data: { paymentStatus: 'PAID' } }); setMenuTarget(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <DollarSign className="h-4 w-4 text-emerald-500" /> Mark as Paid
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
