'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import InlineTerminal from '@/components/layout/inline-terminal';

export default function AdminTerminalPage() {
  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin/backup"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Back to Backup"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VPS Terminal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Run shell commands directly on the server</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <InlineTerminal fullHeight />
      </div>
    </div>
  );
}
