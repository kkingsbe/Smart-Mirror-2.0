'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Client-side error occurred:', error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Application Error</h2>
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 rounded overflow-auto max-h-[250px]">
          <p className="font-mono text-sm">{error.message}</p>
          {error.stack && (
            <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
} 