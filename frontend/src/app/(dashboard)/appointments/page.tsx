'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Search, X, Filter, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';

const statusStyles: Record<string, string> = {
  SCHEDULED: 'badge-gradient-blue',
  COMPLETED: 'badge-gradient-green',
  CANCELLED: 'badge-gradient-purple',
  NO_SHOW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [newApt, setNewApt] = useState({ patientId: '', date: '', time: '', notes: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ id: string; top: number; right: number } | null>(null);

  const buildParams = (p: number) => {
    const params: Record<string, string> = { page: String(p), limit: '15' };
    if (search) params.search = search;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  };

  const load = async (p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments', { params: buildParams(p) });
      setAppointments(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page) }, [page, search, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('ALL');
    setPage(1);
  };

  const hasFilters = search || dateFrom || dateTo || statusFilter !== 'ALL';

  const openCreate = async () => {
    setOpen(true);
    try {
      const { data } = await api.get('/patients', { params: { limit: 100 } });
      setPatients(data.data);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/appointments', newApt);
      toast.success('Appointment scheduled');
      setOpen(false);
      setNewApt({ patientId: '', date: '', time: '', notes: '' });
      load(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/appointments/${id}`, { status });
      load(page);
      toast.success(`Appointment ${status.toLowerCase()}`);
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your schedule</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="h-10 rounded-xl gradient-primary hover:opacity-90 text-white shadow-glow">
              <Plus className="h-4 w-4 mr-2" />New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Schedule Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select value={newApt.patientId} onValueChange={(v) => setNewApt({ ...newApt, patientId: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newApt.date} onChange={(e) => setNewApt({ ...newApt, date: e.target.value })} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={newApt.time} onChange={(e) => setNewApt({ ...newApt, time: e.target.value })} required className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={newApt.notes} onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl gradient-primary text-white">Schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="h-10 px-4 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-700 flex items-center gap-2 transition-all"
            >
              <Filter className="h-4 w-4" />
              {dateFrom || dateTo ? 'Date: Set' : 'Date Filter'}
            </button>
            {showDateFilter && (
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

      <Card className="premium-card overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {hasFilters ? 'No matching appointments' : 'No appointments'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {hasFilters ? 'Try adjusting your search or filters' : 'Schedule your first appointment'}
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              ) : (
                <Button variant="outline" onClick={() => openCreate()}>Schedule Appointment</Button>
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
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt: any, i: number) => (
                      <tr key={apt.id}>
                        <td className="font-medium text-gray-900 dark:text-white">{apt.patient?.fullName}</td>
                        <td className="font-mono text-xs text-muted-foreground">{apt.patient?.patientId || '—'}</td>
                        <td className="text-muted-foreground">{apt.patient?.phone || '—'}</td>
                        <td>{new Date(apt.date).toLocaleDateString()}</td>
                        <td className="font-mono text-sm">{(() => { const [h, m] = apt.time.split(':'); const hh = Number(h); return `${hh % 12 || 12}:${m} ${hh < 12 ? 'AM' : 'PM'}`; })()}</td>
                        <td><span className={statusStyles[apt.status] || 'badge-gradient-blue'}>{apt.status}</span></td>
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
                <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
              </div>
            </>
          )}

          {/* Actions Menu */}
          {menuTarget && appointments.length > 0 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuTarget(null)} />
              <div
                className="fixed z-50 w-44 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-strong py-1.5 animate-scale-in"
                style={{ top: menuTarget.top, right: menuTarget.right }}
              >
                {(() => {
                  const apt = appointments.find((a: any) => a.id === menuTarget.id);
                  if (!apt) return null;
                  return (
                    <>
                      {apt.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => { updateStatus(apt.id, 'COMPLETED'); setMenuTarget(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500" /> Mark Completed
                          </button>
                          <button
                            onClick={() => { updateStatus(apt.id, 'CANCELLED'); setMenuTarget(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <XCircle className="h-4 w-4 text-red-500" /> Cancel Appointment
                          </button>
                        </>
                      )}
                      {apt.status !== 'SCHEDULED' && (
                        <p className="px-4 py-2.5 text-sm text-muted-foreground">No actions available</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
