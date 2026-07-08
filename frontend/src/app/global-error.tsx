'use client';

import NextError from 'next/error';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-4xl font-bold text-destructive">500</h1>
            <h2 className="mb-4 text-xl font-semibold">Something went wrong!</h2>
            <p className="mb-6 text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={reset}
              className="rounded-md bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}