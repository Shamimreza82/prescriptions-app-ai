import { cn } from '@/lib/utils';
import { PrescriptionTemplate } from '../types';
import { Check } from 'lucide-react';

interface TemplateCardProps {
  template: PrescriptionTemplate;
  isSelected: boolean;
  onClick: () => void;
}

export function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  const getPreviewTheme = () => {
    switch (template.thumbnail) {
      case 'modern':
        return {
          gradient: 'from-teal-50 via-white to-cyan-50',
          border: 'border-teal-200 dark:border-teal-800',
          accent: 'bg-teal-500',
          header: 'bg-gradient-to-r from-teal-500 to-teal-600',
          line: 'bg-teal-200',
        };
      case 'minimal':
        return {
          gradient: 'from-slate-50 to-white',
          border: 'border-slate-200 dark:border-slate-700',
          accent: 'bg-slate-500',
          header: 'bg-slate-200 dark:bg-slate-700',
          line: 'bg-slate-200',
        };
      default:
        return {
          gradient: 'from-gray-100 to-white',
          border: 'border-gray-300 dark:border-gray-600',
          accent: 'bg-gray-800',
          header: 'bg-gray-800',
          line: 'bg-gray-200',
        };
    }
  };

  const theme = getPreviewTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border p-3 transition-all duration-200 group relative overflow-hidden',
        isSelected
          ? 'ring-2 ring-teal-500 border-teal-500 bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-950/30 dark:to-gray-900 shadow-md shadow-teal-500/10'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white">
          <Check className="h-3 w-3" />
        </div>
      )}
      <div
        className={cn(
          'h-20 rounded-lg border mb-3 bg-gradient-to-br flex flex-col justify-between p-2.5',
          theme.gradient,
          theme.border
        )}
      >
        <div className={cn('h-2.5 rounded w-full', theme.header)} />
        <div className="flex gap-3">
          <div className={cn('w-1/3 h-full rounded space-y-1', theme.line)}>
            <div className="h-1 w-full bg-white/50 rounded" />
            <div className="h-1 w-2/3 bg-white/50 rounded" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-1 w-full bg-gray-300/60 rounded" />
            <div className="h-1 w-5/6 bg-gray-300/60 rounded" />
            <div className="h-1 w-4/6 bg-gray-300/60 rounded" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className={cn('w-12 h-1 rounded', theme.accent)} />
        </div>
      </div>
      <p className={cn(
        'font-bold text-sm',
        isSelected ? 'text-teal-800 dark:text-teal-200' : 'text-gray-900 dark:text-gray-100'
      )}>
        {template.name}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{template.description}</p>
    </button>
  );
}
