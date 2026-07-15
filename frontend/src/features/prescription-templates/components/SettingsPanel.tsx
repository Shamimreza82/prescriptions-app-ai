'use client';

import { X, RotateCcw, Eye, EyeOff, Type, Layout, Shield, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PrescriptionOptions } from '../types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  options: PrescriptionOptions;
  onUpdate: <K extends keyof PrescriptionOptions>(key: K, value: PrescriptionOptions[K]) => void;
  onReset: () => void;
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
          checked
            ? 'bg-teal-500 dark:bg-teal-600'
            : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function SettingsPanel({ open, onClose, options, onUpdate, onReset }: SettingsPanelProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto border-l border-gray-200 dark:border-gray-800',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 text-xs">⚙️</span>
            Prescription Settings
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5 text-sm">

          {/* Visibility */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
              <Eye className="w-3 h-3" /> Visibility
            </h3>
            <div className="bg-gray-50 dark:bg-gray-950/50 rounded-xl px-3 py-1.5">
              <Toggle label="QR Code" checked={options.showQRCode} onChange={(v) => onUpdate('showQRCode', v)} />
              <Toggle label="Signature" checked={options.showSignature} onChange={(v) => onUpdate('showSignature', v)} />
              <Toggle label="Letterhead" checked={options.showLetterhead} onChange={(v) => onUpdate('showLetterhead', v)} />
              <Toggle label="Footer" checked={options.showFooter} onChange={(v) => onUpdate('showFooter', v)} />
              <Toggle label="Patient Phone/Address" checked={options.showPatientContact} onChange={(v) => onUpdate('showPatientContact', v)} />
              <Toggle label="Vitals" checked={options.showVitals} onChange={(v) => onUpdate('showVitals', v)} />
              <Toggle label="Diagnosis" checked={options.showDiagnosis} onChange={(v) => onUpdate('showDiagnosis', v)} />
              <Toggle label="Generic Names" checked={options.showGenericName} onChange={(v) => onUpdate('showGenericName', v)} />
              <Toggle label="Investigations" checked={options.showInvestigations} onChange={(v) => onUpdate('showInvestigations', v)} />
              <Toggle label="Advice" checked={options.showAdvice} onChange={(v) => onUpdate('showAdvice', v)} />
              <Toggle label="Food Advice" checked={options.showFoodAdvice} onChange={(v) => onUpdate('showFoodAdvice', v)} />
            </div>
          </section>

          {/* Medicine Display */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
              <Pill className="w-3 h-3" /> Medicine Display
            </h3>
            <div className="bg-gray-50 dark:bg-gray-950/50 rounded-xl px-3 py-1.5">
              <Select
                label="Sort by"
                value={options.medicineSortBy}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'name', label: 'Brand Name' },
                  { value: 'form', label: 'Form (Tab/Cap/Inj)' },
                ]}
                onChange={(v) => onUpdate('medicineSortBy', v as 'default' | 'name' | 'form')}
              />
              <Select
                label="Dosage format"
                value={options.dosageFormat}
                options={[
                  { value: 'numeric', label: '1+0+1' },
                  { value: 'text', label: 'Morning + Night' },
                ]}
                onChange={(v) => onUpdate('dosageFormat', v as 'numeric' | 'text')}
              />
            </div>
          </section>

          {/* Layout */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
              <Layout className="w-3 h-3" /> Layout
            </h3>
            <div className="bg-gray-50 dark:bg-gray-950/50 rounded-xl px-3 py-1.5">
              <Toggle label="Compact Mode" checked={options.compactMode} onChange={(v) => onUpdate('compactMode', v)} />
              <Toggle label="Grayscale Mode" checked={options.grayscaleMode} onChange={(v) => onUpdate('grayscaleMode', v)} />
              <Select
                label="Font size"
                value={options.fontSize}
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                onChange={(v) => onUpdate('fontSize', v as 'small' | 'medium' | 'large')}
              />
            </div>
          </section>

          {/* Security & Label */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Security & Label
            </h3>
            <div className="bg-gray-50 dark:bg-gray-950/50 rounded-xl px-3 py-1.5">
              <Select
                label="Prescription label"
                value={options.prescriptionTypeLabel}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'original', label: 'Original' },
                  { value: 'duplicate', label: 'Duplicate' },
                  { value: 'copy', label: 'Copy' },
                ]}
                onChange={(v) => onUpdate('prescriptionTypeLabel', v as 'none' | 'original' | 'duplicate' | 'copy')}
              />
              <Toggle label="Draft Watermark" checked={options.draftWatermark} onChange={(v) => onUpdate('draftWatermark', v)} />
              <div className="py-1.5">
                <span className="text-xs text-gray-700 dark:text-gray-300 block mb-1">Disclaimer</span>
                <textarea
                  value={options.disclaimerText}
                  onChange={(e) => onUpdate('disclaimerText', e.target.value)}
                  placeholder="e.g. Valid for 7 days..."
                  rows={2}
                  className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 px-2 py-1.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Reset */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="w-full rounded-lg text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" /> Reset to Defaults
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}