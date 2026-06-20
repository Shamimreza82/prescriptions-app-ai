'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/axios';
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const [showFields, setShowFields] = useState({ current: false, new: false, confirm: false });
  const [successDialog, setSuccessDialog] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', data),
    onSuccess: () => {
      reset();
      setSuccessDialog(true);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const onSubmit = (data: Form) => {
    mutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword });
  };

  const PasswordInput = ({ field, label, placeholder }: { field: 'current' | 'new' | 'confirm'; label: string; placeholder: string }) => {
    const regKey = field === 'current' ? 'currentPassword' as const : field === 'new' ? 'newPassword' as const : 'confirmPassword' as const;
    const showKey = field === 'current' ? 'current' as const : field === 'new' ? 'new' as const : 'confirm' as const;
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label} <span className="text-red-500">*</span></label>
        <div className="relative">
          <input
            type={showFields[showKey] ? 'text' : 'password'}
            {...register(regKey)}
            className="premium-input w-full h-11 px-4 pr-11"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => setShowFields((prev) => ({ ...prev, [showKey]: !prev[showKey] }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showFields[showKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors[regKey] && <p className="text-xs text-red-500 mt-1">{errors[regKey].message}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/doctor" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your account password</p>
        </div>
      </div>

      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Password Changed</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground text-center">Your password has been updated successfully.</p>
          </div>
          <Button onClick={() => setSuccessDialog(false)} className="w-full">Done</Button>
        </DialogContent>
      </Dialog>

      <div className="premium-card-static p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-glow">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
              <p className="text-xs text-muted-foreground">Choose a strong, unique password</p>
            </div>
          </div>

          <PasswordInput field="current" label="Current Password" placeholder="Enter current password" />
          <PasswordInput field="new" label="New Password" placeholder="Min 6 characters" />
          <PasswordInput field="confirm" label="Confirm New Password" placeholder="Re-enter new password" />

          <Button type="submit" className="w-full h-11" disabled={mutation.isPending}>
            {mutation.isPending ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
