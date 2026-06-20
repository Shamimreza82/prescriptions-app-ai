'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRecAppointment, useUpdateRecAppointment } from '@/features/receptionist/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Phone, FileText, DollarSign } from 'lucide-react';

const statusStyles: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  NO_SHOW: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
};

export default function RecAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: apt, isLoading } = useRecAppointment(id);
  const updateApt = useUpdateRecAppointment();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!apt) return <div className="text-center py-12 text-muted-foreground">Appointment not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/receptionist/appointments')} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Details</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View and manage this appointment</p>
        </div>
      </div>

      <Card className="premium-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" /> Appointment
          </CardTitle>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[apt.status] || ''}`}>
            {apt.status}
          </span>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{apt.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fee</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{apt.fee ? `${apt.fee.toFixed(2)}` : '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <Badge variant={apt.paymentStatus === 'PAID' ? 'success' : 'secondary'}>{apt.paymentStatus || 'UNPAID'}</Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800/50 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" /> Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <User className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{apt.patient?.fullName || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Patient ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{apt.patient?.patientId || '—'}</p>
                </div>
              </div>
              {apt.patient?.age && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{apt.patient.age} years</p>
                  </div>
                </div>
              )}
              {apt.patient?.phone && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{apt.patient.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {apt.notes && (
            <div className="border-t border-gray-100 dark:border-gray-800/50 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">{apt.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/50">
            {apt.status === 'SCHEDULED' && (
              <>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => updateApt.mutate({ id: apt.id, data: { status: 'COMPLETED' } })}
                >
                  Mark Completed
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => updateApt.mutate({ id: apt.id, data: { status: 'CANCELLED' } })}
                >
                  Cancel Appointment
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => router.push('/dashboard/receptionist/appointments')}>
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
