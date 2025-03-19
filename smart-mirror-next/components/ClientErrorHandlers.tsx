'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Import ErrorBoundary dynamically with no SSR
const ErrorBoundary = dynamic(
  () => import('./ErrorBoundary'),
  { ssr: false }
);

// Import ErrorHandler dynamically with no SSR
const ErrorHandler = dynamic(
  () => import('./ErrorHandler'),
  { ssr: false }
);

export default function ClientErrorHandlers({ children }: { children: ReactNode }) {
  return (
    <>
      <ErrorHandler />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </>
  );
} 