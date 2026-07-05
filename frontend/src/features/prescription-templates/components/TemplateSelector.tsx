'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutTemplate, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prescriptionTemplates } from '../registry';
import { TemplateCard } from './TemplateCard';

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  storageKey?: string;
}

export function TemplateSelector({ selectedId, onSelect, storageKey = 'prescription-template-selector-open' }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (saved !== null) {
      setIsOpen(saved === 'true');
    }
  }, [storageKey]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(next));
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm transition-all duration-300 shrink-0',
        isOpen ? 'w-72' : 'w-12'
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-teal-100 dark:border-teal-900/30">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
              <LayoutTemplate className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100 block leading-tight">Templates</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Choose print style</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30 text-teal-600 dark:text-teal-400 transition-colors',
            !isOpen && 'mx-auto'
          )}
          title={isOpen ? 'Collapse templates' : 'Expand templates'}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-3.5 w-3.5 text-teal-500" />
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">Select a print template</p>
          </div>
          {prescriptionTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedId === template.id}
              onClick={() => onSelect(template.id)}
            />
          ))}
        </div>
      )}

      {!isOpen && (
        <div className="flex-1 flex flex-col items-center pt-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
            <LayoutTemplate className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  );
}
