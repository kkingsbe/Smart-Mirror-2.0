'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { NextPage } from 'next';

// Define a type for the API response
interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
  details?: string;
  raw?: string;
  [key: string]: unknown; // For any other properties that might be in the response
}

const CalendarLinkPage: NextPage<{ params: { token: string } }> = ({ params }) => {
  const { token } = params;
  const { data: session, status } = useSession();
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  
  // Function to notify the Smart Mirror about successful authentication
  const notifyMirror = useCallback(() => {
    console.log('Notifying mirror about successful authentication');
    
    // Method 1: Use BroadcastChannel API for same-origin communication
    try {
      const channel = new BroadcastChannel('smart-mirror-auth');
      channel.postMessage({ 
        type: 'AUTH_SUCCESS',
        token,
        timestamp: Date.now()
      });
      
      // Send multiple notifications to increase reliability
      const sendDelayedNotification = (delay: number) => {
        setTimeout(() => {
          try {
            const delayedChannel = new BroadcastChannel('smart-mirror-auth');
            delayedChannel.postMessage({ 
              type: 'AUTH_SUCCESS',
              token,
              timestamp: Date.now()
            });
            setTimeout(() => delayedChannel.close(), 500);
          } catch (e) {
            console.error('Error in delayed notification:', e);
          }
        }, delay);
      };
      
      // Send additional notifications with delays to increase chance of receipt
      sendDelayedNotification(500);
      sendDelayedNotification(1500);
      
      setTimeout(() => channel.close(), 2000);
    } catch (err) {
      console.error('BroadcastChannel not supported:', err);
      // Fall back to localStorage method if BroadcastChannel is not supported
    }
    
    // Method 2: Use localStorage for cross-domain/window communication
    try {
      // Set the timestamp and keep updating it to ensure the mirror detects the change
      localStorage.setItem('authStatusTime', Date.now().toString());
      
      // Update localStorage again after short delays to increase chance of detection
      setTimeout(() => localStorage.setItem('authStatusTime', Date.now().toString()), 1000);
      setTimeout(() => localStorage.setItem('authStatusTime', Date.now().toString()), 3000);
    } catch (err) {
      console.error('localStorage not available:', err);
    }
    
    // Try the test API as well
    fetch('/api/calendar/test', {
      method: 'POST',
    })
    .then(res => res.json())
    .then(data => {
      console.log('Test API response:', data);
    })
    .catch(err => {
      console.error('Test API error:', err);
    });
  }, [token]);
  
  // Function to link the mirror with Google credentials
  const linkMirror = useCallback(async () => {
    if (!session?.accessToken || isLinking || linkSuccess) return;
    
    setIsLinking(true);
    
    try {
      // Log important data
      console.log('Linking token:', token);
      console.log('Session data available:', !!session);
      console.log('Access token available:', !!session.accessToken);
      
      // Log the URL we're going to call
      const apiUrl = '/api/calendar/store-credentials';
      console.log('API URL:', apiUrl);
      
      // Make the API call with detailed logging
      console.log('Making API call...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to get the response body as text first to ensure we can see it even if it's not valid JSON
      const responseText = await response.text();
      console.log('Response body (text):', responseText);
      
      // Try to parse as JSON
      let data: ApiResponse;
      try {
        data = JSON.parse(responseText);
        console.log('Response parsed as JSON:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        data = { error: 'Invalid JSON response', raw: responseText };
      }
      
      setApiResponse(data);
      
      if (response.ok) {
        setLinkSuccess(true);
        // Notify the mirror that authentication was successful
        notifyMirror();
        
        // Start interval to repeatedly notify for 30 seconds
        // This helps ensure the mirror receives at least one notification
        const notifyInterval = setInterval(notifyMirror, 5000);
        setTimeout(() => clearInterval(notifyInterval), 30000);
      } else {
        // Instead of using response.json(), we already have the data
        setLinkError(data?.error || 'Failed to link calendar');
      }
    } catch (error) {
      console.error('Error linking calendar:', error);
      setLinkError('Failed to connect to server: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLinking(false);
    }
  }, [session, isLinking, linkSuccess, token, notifyMirror]);
  
  // Wait for the session to be available, then link the mirror
  useEffect(() => {
    if (session?.accessToken && !isLinking && !linkSuccess) {
      linkMirror();
    }
  }, [session, isLinking, linkSuccess, linkMirror]);

  // Send another notification when the component unmounts if link was successful
  useEffect(() => {
    return () => {
      if (linkSuccess) {
        notifyMirror();
      }
    };
  }, [linkSuccess, notifyMirror]);

  // Try the test API endpoint
  useEffect(() => {
    fetch('/api/calendar/test')
      .then(res => res.json())
      .then(data => {
        console.log('Test API endpoint response:', data);
      })
      .catch(err => {
        console.error('Test API endpoint error:', err);
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Smart Mirror Calendar Setup</h1>
        
        {status === 'loading' || isLinking ? (
          <div className="text-center p-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p>{isLinking ? 'Linking your calendar...' : 'Loading...'}</p>
          </div>
        ) : linkSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-700 bg-opacity-20 p-4 rounded-md border border-green-500">
              <p className="font-medium text-green-400 mb-2">
                Successfully connected to Google Calendar!
              </p>
              <p className="text-sm text-gray-300">
                Your calendar events will now appear on your Smart Mirror.
              </p>
              <p className="text-sm text-gray-300 mt-2">
                You can close this window.
              </p>
            </div>
          </div>
        ) : session ? (
          <div className="space-y-4">
            {linkError && (
              <div className="bg-red-700 bg-opacity-20 p-4 rounded-md border border-red-500 mb-4">
                <p className="font-medium text-red-400">{linkError}</p>
                
                {/* For debugging - show API response details */}
                {apiResponse && (
                  <details className="mt-2 text-xs text-gray-300">
                    <summary>API Response Details</summary>
                    <pre className="whitespace-pre-wrap mt-1 p-2 bg-gray-900 rounded overflow-auto max-h-40">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <p className="text-gray-300 mb-4">
              You&apos;re signed in as <span className="font-medium">{session.user?.name || 'User'}</span>.
            </p>
            
            <p className="text-gray-300 mb-4">
              Click the button below to link your Google Calendar to the Smart Mirror.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={linkMirror}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                disabled={isLinking}
              >
                Link Calendar
              </button>
            </div>
            
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex justify-center">
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
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
};

export default CalendarLinkPage; 