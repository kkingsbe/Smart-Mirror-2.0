'use client';

import { useEffect } from 'react';
import { initGlobalErrorHandlers } from '../lib/errorHandler';

export default function ErrorHandler() {
  useEffect(() => {
    // Initialize global error handlers
    initGlobalErrorHandlers();
  }, []);

  return null; // This component doesn't render anything
} 