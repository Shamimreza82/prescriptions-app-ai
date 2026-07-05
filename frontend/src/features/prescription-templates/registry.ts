import { PrescriptionTemplate } from './types';
import { DefaultTemplate } from './templates/DefaultTemplate';
import { ModernTealTemplate } from './templates/ModernTealTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';

export const prescriptionTemplates: PrescriptionTemplate[] = [
  {
    id: 'default',
    name: 'Classic Professional',
    description: 'Traditional black & white prescription layout with bold borders.',
    thumbnail: 'classic',
    component: DefaultTemplate,
  },
  {
    id: 'modern-teal',
    name: 'Modern Teal',
    description: 'Clean teal-accented design with modern typography.',
    thumbnail: 'modern',
    component: ModernTealTemplate,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Compact borderless layout focused on readability.',
    thumbnail: 'minimal',
    component: MinimalTemplate,
  },
];

export const defaultTemplateId = 'modern-teal';

export const getTemplateById = (id: string): PrescriptionTemplate | undefined =>
  prescriptionTemplates.find((t) => t.id === id);
