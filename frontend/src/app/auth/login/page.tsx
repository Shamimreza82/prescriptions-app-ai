'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useThemeContext } from '@/providers/theme-provider';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema } from '@/features/auth/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Moon, Sun, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const { theme, toggle } = useThemeContext();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => login.mutate(data);

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/20 to-indigo-100/20 dark:from-blue-900/5 dark:to-indigo-900/5 rounded-full blur-3xl hidden sm:block" />
      </div>

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" onClick={toggle} className="fixed top-6 right-6 z-50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-full border border-gray-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-800/80">
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo/brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient">PresManage</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Doctor Prescription Management System</p>
          </div>

          {/* Card */}
          <div className="glass-strong rounded-2xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="doctor@example.com" className="pl-10 h-11 premium-input" {...register('email')} />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="pl-10 pr-11 h-11 premium-input" {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl gradient-primary hover:opacity-90 transition-opacity text-white font-medium shadow-glow" disabled={login.isPending}>
                {login.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">New here?</span></div>
              </div>

              <Link href="/auth/register">
                <Button type="button" variant="outline" className="w-full h-11 rounded-xl border-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                  Create an account
                </Button>
              </Link>
            </form>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Demo Credentials</p>
            <div className="space-y-1.5">
              {[
                { label: 'Admin', email: 'admin@presmanage.com', pass: 'admin123' },
                { label: 'Doctor', email: 'doctor@example.com', pass: 'doctor123' },
                { label: 'MR', email: 'mr@example.com', pass: 'mr123456' },
                { label: 'receptionist', email: 'receptionist@example.com', pass: '123456' },
              ].map((cred) => (
                <button
                  key={cred.label}
                  type="button"
                  onClick={() => {
                    setValue('email', cred.email, { shouldValidate: true });
                    setValue('password', cred.pass, { shouldValidate: true });
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs bg-white/70 dark:bg-gray-900/70 hover:bg-white dark:hover:bg-gray-900 border border-blue-100 dark:border-blue-900/50 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-blue-700 dark:text-blue-300">{cred.label}</span>
                  <span className="text-muted-foreground">{cred.email} / {cred.pass}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
