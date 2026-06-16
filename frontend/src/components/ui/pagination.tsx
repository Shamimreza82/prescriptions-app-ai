'use client';

import { useState, useCallback } from 'react';
import { Button } from './button';
import { Input } from './input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ page, totalPages, total, onPageChange, className }: PaginationProps) => {
  const [jumpValue, setJumpValue] = useState('');

  const goToPage = useCallback((p: number) => {
    const clamped = Math.max(1, Math.min(p, totalPages || 1));
    onPageChange(clamped);
    setJumpValue('');
  }, [totalPages, onPageChange]);

  const handleJumpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const p = parseInt(jumpValue, 10);
      if (!isNaN(p) && p >= 1) goToPage(p);
    }
  };

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 1) return [1];
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1;
    const rangeStart = Math.max(2, page - delta);
    const rangeEnd = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (rangeStart > 2) pages.push('ellipsis');
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
    if (rangeEnd < totalPages - 1) pages.push('ellipsis');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-2', className)}>
      {total !== undefined && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{total}</span> total results
        </p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goToPage(1)}
          className="h-7 w-7 p-0 rounded-lg hidden sm:inline-flex"
          title="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          className="h-7 px-2 rounded-lg"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline text-xs">Prev</span>
        </Button>

        {getVisiblePages().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`}           className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={cn(
                'relative h-7 min-w-[1.75rem] rounded-lg text-xs font-medium transition-all px-1.5',
                p === page
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {p}
            </button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
          className="h-7 px-2 rounded-lg"
        >
          <span className="hidden sm:inline text-xs">Next</span>
          <ChevronRight className="h-3.5 w-3.5 sm:ml-1" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goToPage(totalPages)}
          className="h-7 w-7 p-0 rounded-lg hidden sm:inline-flex"
          title="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={totalPages || 1}
              placeholder="Go to"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={handleJumpKeyDown}
              className="h-8 w-16 rounded-lg text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!jumpValue}
              onClick={() => goToPage(parseInt(jumpValue, 10))}
              className="h-8 rounded-lg text-xs px-2.5"
            >
              Go
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
