'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Pencil, Plus, Calendar, FileText, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';
import { TemplateSelector } from '@/features/prescription-templates/components/TemplateSelector';
import { getTemplateById, defaultTemplateId } from '@/features/prescription-templates/registry';

const TEMPLATE_STORAGE_KEY = 'prescription-template-preference';

interface PrescriptionViewProps {
  isLoading: boolean;
  prescription: any;
  backUrl: string;
  prescriptionId: string;
  showActions?: {
    new?: boolean;
    edit?: boolean;
  };
  defaultTemplateId?: string;
}

export function PrescriptionView({ isLoading, prescription: rx, backUrl, prescriptionId, showActions, defaultTemplateId: propDefaultId }: PrescriptionViewProps) {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [blankPrint, setBlankPrint] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(propDefaultId || defaultTemplateId);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    QRCodeLib.toDataURL(`${apiBase}/verify`, { width: 72, margin: 1, color: { dark: '#0f766e', light: '#ffffff' } })
      .then(setQrDataUrl).catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (saved && getTemplateById(saved)) {
      setSelectedTemplateId(saved);
    }
  }, []);

  useEffect(() => {
    if (blankPrint) window.print();
  }, [blankPrint]);

  useEffect(() => {
    const afterPrint = () => setBlankPrint(false);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, templateId);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 bg-slate-50/50 dark:bg-gray-950/50">
        <div className="h-20 bg-white dark:bg-gray-950 border-b animate-pulse" />
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!rx) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 bg-slate-50/50 dark:bg-gray-950/50 items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Prescription not found</h2>
          <p className="text-muted-foreground mb-6">The prescription you are looking for does not exist or has been removed.</p>
          <Button onClick={() => router.push(backUrl)} className="bg-teal-600 hover:bg-teal-700">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Prescriptions
          </Button>
        </div>
      </div>
    );
  }

  const selectedTemplate = getTemplateById(selectedTemplateId) || getTemplateById(defaultTemplateId)!;
  const TemplateComponent = selectedTemplate.component;

  const formattedDate = new Date(rx.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 bg-slate-50/50 dark:bg-gray-950/50">
      <style>{`
        @page { size: A4; margin: 0; }
        ${blankPrint ? '@page { margin-top: 200px; }' : ''}
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 210mm;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
          #print-content > div {
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
        }
        @media print { #print-content[data-blank-print="true"] .letterhead, #print-content[data-blank-print="true"] .header-separator, #print-content[data-blank-print="true"] .signature { display: none !important; } }
      `}</style>

      <header className="shrink-0 bg-white dark:bg-gray-950 border-b border-teal-100 dark:border-teal-900/30">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(backUrl)}
                className="rounded-xl border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Prescription #{rx.prescriptionNo}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800">
                    <Stethoscope className="h-3 w-3" />
                    {rx.doctor?.specialization?.[0] || 'Medical Prescription'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-500" />
                    {formattedDate}
                  </span>
                  {rx.patient && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">{rx.patient.fullName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {showActions?.new && (
                <Button
                  variant="outline"
                  asChild
                  className="rounded-xl border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-800"
                >
                  <Link href="/prescriptions/new">
                    <Plus className="h-4 w-4 mr-2" />New
                  </Link>
                </Button>
              )}
              {showActions?.edit && (
                <Button
                  variant="outline"
                  asChild
                  className="rounded-xl border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-800"
                >
                  <Link href={`/prescriptions/${prescriptionId}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />Edit
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setBlankPrint(true)}
                className="rounded-xl border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-800"
              >
                <Printer className="h-4 w-4 mr-2" />Pad Print
              </Button>
              <Button
                onClick={() => window.print()}
                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
              >
                <Printer className="h-4 w-4 mr-2" />Print
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <TemplateSelector
          selectedId={selectedTemplateId}
          onSelect={handleSelectTemplate}
        />
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[210mm] mx-auto">
            <div
              id="print-content"
              data-blank-print={blankPrint}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-strong overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <TemplateComponent
                prescription={rx}
                qrDataUrl={qrDataUrl}
                blankPrint={blankPrint}
              />
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Preview with &quot;{selectedTemplate.name}&quot; template
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
