'use client';

import React, { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function CalendarAuth() {
  const { data: session, status } = useSession();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // If we have a session and access token, redirect after 3 seconds
    if (session?.accessToken && !redirecting) {
      setRedirecting(true);
      
      // Try to set a flag in localStorage to signal successful authentication
      try {
        localStorage.setItem('calendarAuthSuccess', Date.now().toString());
        
        // If this is opened in a popup or iframe from the smart mirror, try to notify the parent
        if (window.opener) {
          window.opener.postMessage({ type: 'CALENDAR_AUTH_SUCCESS' }, '*');
        }
      } catch (e) {
        console.error('Failed to set localStorage flag:', e);
      }
      
      const timer = setTimeout(() => {
        window.location.href = '/'; // Redirect to home page
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [session, redirecting]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Smart Mirror Calendar Setup</h1>
        
        {status === 'loading' ? (
          <p className="text-center">Loading...</p>
        ) : session ? (
          <div className="space-y-4">
            <div className="bg-green-700 bg-opacity-20 p-4 rounded-md border border-green-500">
              <p className="font-medium text-green-400 mb-2">
                Successfully connected to Google Calendar!
              </p>
              <p className="text-sm text-gray-300">
                Your calendar events will now appear on your Smart Mirror. You can close this window.
              </p>
              {redirecting && (
                <p className="text-sm text-gray-400 mt-2">
                  Redirecting to home page...
                </p>
              )}
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-300">
              Connect your Google Calendar to display your events on your Smart Mirror.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => signIn('google')}
                className="flex items-center px-6 py-3 bg-white text-gray-800 rounded-md hover:bg-gray-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Connect with Google
              </button>
            </div>
            
            <p className="text-sm text-gray-400 text-center">
              Your data remains private and is only used to display your calendar events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 