'use client';

import { useState, useCallback, useEffect } from 'react';
import { PrescriptionOptions, defaultOptions } from '../types';
import { getUser } from '@/lib/utils';

const OPTIONS_STORAGE_KEY = 'prescription-options';

function loadOptions(): PrescriptionOptions {
  if (typeof window === 'undefined') return { ...defaultOptions };
  const user = getUser();
  const key = user?.id ? `${OPTIONS_STORAGE_KEY}-${user.id}` : OPTIONS_STORAGE_KEY;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultOptions, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...defaultOptions };
}

function saveOptions(options: PrescriptionOptions) {
  if (typeof window === 'undefined') return;
  const user = getUser();
  const key = user?.id ? `${OPTIONS_STORAGE_KEY}-${user.id}` : OPTIONS_STORAGE_KEY;
  localStorage.setItem(key, JSON.stringify(options));
}

export function usePrescriptionOptions() {
  const [options, setOptions] = useState<PrescriptionOptions>(loadOptions);

  useEffect(() => {
    saveOptions(options);
  }, [options]);

  const updateOption = useCallback(<K extends keyof PrescriptionOptions>(
    key: K,
    value: PrescriptionOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetOptions = useCallback(() => {
    setOptions({ ...defaultOptions });
  }, []);

  return { options, updateOption, resetOptions };
}