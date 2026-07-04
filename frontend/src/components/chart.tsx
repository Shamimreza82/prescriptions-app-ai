'use client';

import { Card } from '@/components/ui/card';

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({ title, description, children, className }: ChartContainerProps) {
  return (
    <Card className={`p-5 premium-card-static ${className || ''}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
  );
}
