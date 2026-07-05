import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays, startOfDay } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const formatFollowUp = (date: string | Date) => {
  const d = startOfDay(
    typeof date === 'string' && !date.includes('T')
      ? new Date(`${date}T00:00:00`)
      : new Date(date)
  );
  const today = startOfDay(new Date());
  const formatted = formatDate(d);
  const days = differenceInDays(d, today);
  if (days < 0) return `${formatted} (${Math.abs(days)} days ago)`;
  if (days === 0) return `${formatted} (Today)`;
  if (days === 1) return `${formatted} (Tomorrow)`;
  return `${formatted} (${days} days)`;
};

export const getAuthToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('theme');
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const setUser = (user: unknown) => localStorage.setItem('user', JSON.stringify(user));
