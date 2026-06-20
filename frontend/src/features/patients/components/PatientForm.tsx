'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { patientSchema } from '../schema';
import { useCreatePatient, useUpdatePatient } from '../hooks';
import { useAdminDoctors } from '@/features/dashboard/hooks';
import { toast } from 'sonner';

const BLOOD_GROUPS = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
];

type FormData = z.infer<typeof patientSchema> & { doctorId?: string };

interface PatientFormProps {
  onSuccess?: () => void;
  initialData?: FormData & { doctorId?: string; id?: string };
}

export const PatientForm = ({ onSuccess, initialData }: PatientFormProps) => {
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const { data: doctors } = useAdminDoctors({ limit: 200 });
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(patientSchema) });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && initialData?.id) {
        await update.mutateAsync({ id: initialData.id, data });
        toast.success('Patient updated successfully');
      } else {
        await create.mutateAsync(data);
        toast.success('Patient added successfully');
      }
      onSuccess?.();
    } catch (e) {
      console.error(e);
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="animate-fade-in">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input {...register('fullName')} />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Age <span className="text-red-500">*</span></Label>
                <Input type="number" {...register('age')} />
                {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Gender <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => setValue('gender', v as any)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select onValueChange={(v) => setValue('bloodGroup', v as any)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg.value} value={bg.value}>{bg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" {...register('weight')} />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" step="0.1" {...register('height')} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input {...register('emergencyContact')} />
              </div>
            </div>

            {isEdit && doctors?.data && (
              <div className="space-y-2">
                <Label>Assigned Doctor</Label>
                <Select onValueChange={(v) => setValue('doctorId', v)} defaultValue={initialData?.doctorId}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.data.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.fullName} — {d.clinicName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea {...register('address')} />
            </div>
            <div className="space-y-2">
              <Label>Medical History</Label>
              <Textarea {...register('medicalHistory')} />
            </div>
            <div className="space-y-2">
              <Label>Allergies</Label>
              <Textarea {...register('allergies')} />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Saving...' : isEdit ? 'Update Patient' : 'Save Patient'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
