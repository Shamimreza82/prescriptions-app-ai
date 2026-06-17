'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface MedicineRowProps {
  index: number;
  data: any;
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const dosages = ['1', '½', '1½', '2', '2½', '3', '4'];
const frequencies = [
  { value: 'সকাল', label: 'সকাল (Morning)' },
  { value: 'দুপুর', label: 'দুপুর (Noon)' },
  { value: 'রাত', label: 'রাত (Night)' },
  { value: 'সকাল + দুপুর', label: 'সকাল + দুপুর' },
  { value: 'সকাল + রাত', label: 'সকাল + রাত' },
  { value: 'দুপুর + রাত', label: 'দুপুর + রাত' },
  { value: 'সকাল + দুপুর + রাত', label: 'সকাল + দুপুর + রাত' },
  { value: 'প্রতি ৪ ঘণ্টা', label: 'প্রতি ৪ ঘণ্টা (Every 4h)' },
  { value: 'প্রতি ৬ ঘণ্টা', label: 'প্রতি ৬ ঘণ্টা (Every 6h)' },
  { value: 'প্রতি ৮ ঘণ্টা', label: 'প্রতি ৮ ঘণ্টা (Every 8h)' },
  { value: 'প্রয়োজন মত', label: 'প্রয়োজন মত (As needed)' },
  { value: 'সকাল ১ + রাত ১', label: 'সকাল ১ + রাত ১' },
  { value: 'সকাল ১ + দুপুর ১ + রাত ১', label: 'সকাল ১ + দুপুর ১ + রাত ১' },
];
const durations = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '21 Days', '30 Days', '45 Days', '60 Days', '90 Days'];

const Select = ({
  value, options, placeholder, onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  placeholder: string;
  onChange: (v: string) => void;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export const MedicineRow = ({ index, data, onChange, onRemove, canRemove }: MedicineRowProps) => (
  <div className="p-4 border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Medicine #{index + 1}</span>
      {canRemove && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label>Name *</Label>
        <Input value={data.name} onChange={(e) => onChange(index, 'name', e.target.value)} placeholder="Napa" />
      </div>
      <div className="space-y-1">
        <Label>Strength</Label>
        <Input value={data.strength} onChange={(e) => onChange(index, 'strength', e.target.value)} placeholder="500mg" />
      </div>
      <div className="space-y-1">
        <Label>Dosage *</Label>
        <Select
          value={data.dosage}
          options={dosages.map((d) => ({ value: d, label: d }))}
          placeholder="Select dose"
          onChange={(v) => onChange(index, 'dosage', v)}
        />
      </div>
      <div className="space-y-1">
        <Label>Frequency *</Label>
        <Select
          value={data.frequency}
          options={frequencies}
          placeholder="Select frequency"
          onChange={(v) => onChange(index, 'frequency', v)}
        />
      </div>
      <div className="space-y-1">
        <Label>Duration *</Label>
        <Select
          value={data.duration}
          options={durations.map((d) => ({ value: d, label: d }))}
          placeholder="Select duration"
          onChange={(v) => onChange(index, 'duration', v)}
        />
      </div>
      <div className="space-y-1">
        <Label>Instructions</Label>
        <Input value={data.instructions} onChange={(e) => onChange(index, 'instructions', e.target.value)} placeholder="With water" />
      </div>
    </div>
  </div>
);
