import React, { useEffect, useState, useRef } from 'react';

type CalendarEvent = {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
};

const CalendarWidget = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mirrorToken, setMirrorToken] = useState<string | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<string | null>(null);
  const [intensivePolling, setIntensivePolling] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Setup broadcast channel for cross-tab communication
  useEffect(() => {
    // Create a broadcast channel for communication between tabs
    try {
      broadcastChannelRef.current = new BroadcastChannel('smart-mirror-auth');
      
      // Listen for successful auth events from other tabs/windows
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data.type === 'AUTH_SUCCESS' && event.data.token === mirrorToken) {
          console.log('Received auth success message via BroadcastChannel');
          checkCredentialsStatus(event.data.token);
          setIntensivePolling(true);
        }
      };
      
      return () => {
        broadcastChannelRef.current?.close();
      };
    } catch (err) {
      console.error('BroadcastChannel not supported:', err);
      // BroadcastChannel not supported in this browser, will fall back to polling
    }
  }, [mirrorToken]);

  // Initialize mirror token
  useEffect(() => {
    const initializeMirrorToken = async () => {
      try {
        // Check if we already have a token in localStorage
        let token = localStorage.getItem('mirrorToken');
        
        // If not, request a new one from the server
        if (!token) {
          const response = await fetch('/api/calendar/generate-token');
          const data = await response.json();
          token = data.token;
          
          if (!token) {
            throw new Error('Failed to generate token');
          }
          
          // Store the token for future use
          localStorage.setItem('mirrorToken', token);
        }
        
        setMirrorToken(token);
        
        // Check for authStatus flag in localStorage (for cross-window communication)
        const authStatusTime = localStorage.getItem('authStatusTime');
        if (authStatusTime) {
          const timeDiff = Date.now() - parseInt(authStatusTime);
          if (timeDiff < 60000) { // Auth happened in the last minute
            console.log('Found recent auth success in localStorage');
            setIntensivePolling(true);
          }
          localStorage.removeItem('authStatusTime'); // Clear it once detected
        }
        
        // Start checking for credentials
        checkCredentialsStatus(token);
      } catch (err) {
        console.error('Failed to initialize mirror token:', err);
        setError('Failed to initialize mirror. Please refresh the page.');
        setCheckingAuth(false);
      }
    };
    
    initializeMirrorToken();
    
    // Poll for credential changes more frequently since auth happens on a separate device
    const credentialCheckInterval = setInterval(() => {
      if (mirrorToken && !isAuthenticated) {
        console.log('Regular credential check interval - checking for changes from other devices');
        checkCredentialsStatus(mirrorToken);
      }
    }, 10000); // Check every 10 seconds regardless of other polling mechanisms
    
    // Keep the existing localStorage check interval
    const localStorageCheckInterval = setInterval(() => {
      const authStatusTime = localStorage.getItem('authStatusTime');
      if (authStatusTime) {
        const timeDiff = Date.now() - parseInt(authStatusTime);
        if (timeDiff < 30000) { // Auth happened in the last 30 seconds
          console.log('Found recent auth success in localStorage during polling');
          if (mirrorToken) {
            setIntensivePolling(true);
            checkCredentialsStatus(mirrorToken);
          }
          localStorage.removeItem('authStatusTime'); // Clear it once detected
        }
      }
    }, 3000);
    
    return () => {
      clearInterval(localStorageCheckInterval);
      clearInterval(credentialCheckInterval);
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [isAuthenticated, mirrorToken]);
  
  // Function to disconnect Google Calendar
  const disconnectCalendar = async () => {
    if (!mirrorToken || disconnecting) return;
    
    setDisconnecting(true);
    
    try {
      const response = await fetch('/api/calendar/clear-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: mirrorToken }),
      });
      
      if (response.ok) {
        // Reset component state
        setIsAuthenticated(false);
        setLinkedAccount(null);
        setEvents([]);
        setError(null);
        console.log('Successfully disconnected Google Calendar');
      } else {
        console.error('Failed to disconnect calendar:', await response.text());
      }
    } catch (err) {
      console.error('Error disconnecting calendar:', err);
    } finally {
      setDisconnecting(false);
      setCheckingAuth(false);
    }
  };
  
  // Check if credentials are available for our token
  const checkCredentialsStatus = async (token: string) => {
    try {
      console.log('Checking credentials status...');
      const response = await fetch(`/api/calendar/check-credentials?token=${token}&nocache=${Date.now()}`);
      const data = await response.json();
      
      if (data.linked) {
        console.log('Credentials found! Authenticated as:', data.userName);
        setIsAuthenticated(true);
        setLinkedAccount(data.userName);
        fetchCalendarEvents(token);
        setIntensivePolling(false); // Stop intensive polling once authenticated
      } else {
        // Not linked yet, keep checking
        console.log('No credentials linked yet, will check again soon');
        setIsAuthenticated(false);
        scheduleNextCredentialsCheck(token);
      }
    } catch (err) {
      console.error('Failed to check credentials status:', err);
      scheduleNextCredentialsCheck(token);
    } finally {
      setCheckingAuth(false);
    }
  };
  
  // Schedule the next check based on current state
  const scheduleNextCredentialsCheck = (token: string) => {
    // Clear any existing timeout
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    
    // Set polling interval based on current state
    // Use shorter intervals to ensure we capture auth changes quickly from external devices
    const interval = intensivePolling ? 1000 : 5000; // Poll every 1s when intensive, 5s normally
    
    // Schedule the next check
    pollingTimeoutRef.current = setTimeout(() => {
      checkCredentialsStatus(token);
      
      // If we've been intensively polling for more than 60 seconds (60 attempts at 1s),
      // drop back to normal polling
      if (intensivePolling) {
        const intensiveStartTime = parseInt(localStorage.getItem('intensivePollingStart') || '0');
        if (Date.now() - intensiveStartTime > 60000) { // Extend to 60 seconds for cross-device auth
          console.log('Dropping back to normal polling frequency');
          setIntensivePolling(false);
          localStorage.removeItem('intensivePollingStart');
        }
      }
    }, interval);
  };

  // Set intensive polling when component mounts or when state changes
  useEffect(() => {
    if (intensivePolling && mirrorToken) {
      console.log('Starting intensive polling');
      localStorage.setItem('intensivePollingStart', Date.now().toString());
      checkCredentialsStatus(mirrorToken);
    }
  }, [intensivePolling, mirrorToken]);

  // Add this new effect to automatically fetch events when authenticated
  useEffect(() => {
    if (isAuthenticated && mirrorToken) {
      // Immediately fetch events when authenticated
      fetchCalendarEvents(mirrorToken);
    }
  }, [isAuthenticated, mirrorToken]);

  const fetchCalendarEvents = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/calendar/events?token=${token}&nocache=${Date.now()}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setError('Not authenticated. Please link your Google account.');
          scheduleNextCredentialsCheck(token);
        } else {
          setError('Failed to fetch calendar events');
        }
        return;
      }
      
      // Successfully fetched data, so we're authenticated
      setIsAuthenticated(true);
      const data = await response.json();
      setEvents(data.events);
      
      // Schedule regular refresh of calendar events
      setTimeout(() => fetchCalendarEvents(token), 5 * 60 * 1000);
    } catch (err) {
      setError('Error connecting to server');
      console.error('Failed to fetch calendar events:', err);
      setTimeout(() => fetchCalendarEvents(token), 60000); // Retry after 1 minute on error
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime && event.end.dateTime) {
      // It's a timed event (has start and end time)
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      
      return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (event.start.date) {
      // It's an all-day event
      return 'All day';
    }
    
    return '';
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group events by date
  const groupedEvents = events.reduce((groups: Record<string, CalendarEvent[]>, event) => {
    const dateKey = event.start.dateTime 
      ? new Date(event.start.dateTime).toDateString() 
      : (event.start.date ? new Date(event.start.date).toDateString() : 'Unknown');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(event);
    return groups;
  }, {});

  return (
    <div className="p-4 bg-black bg-opacity-70 rounded-lg max-w-md w-full">
      <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
      
      {checkingAuth && <p>Initializing calendar connection...</p>}
      
      {!checkingAuth && !isAuthenticated && mirrorToken && (
        <div className="text-center">
          <p className="text-red-400 mb-3">Calendar not connected</p>
          <p className="text-sm mb-3">To connect your calendar, scan this QR code with your phone:</p>
          <div className="bg-white p-3 rounded-lg mb-3 mx-auto w-fit">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/calendar/link/${mirrorToken}`)}`}
              alt="QR Code for linking calendar" 
              className="w-36 h-36"
            />
          </div>
          <p className="text-xs text-gray-400">
            Or visit: <span className="text-blue-400 break-all">{`${window.location.origin}/calendar/link/${mirrorToken}`}</span>
          </p>
        </div>
      )}
      
      {!checkingAuth && isAuthenticated && loading && <p>Loading calendar events...</p>}
      
      {!checkingAuth && isAuthenticated && linkedAccount && !loading && (
        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
          <div>Connected to: {linkedAccount}</div>
          <button 
            onClick={disconnectCalendar}
            disabled={disconnecting}
            className="text-red-400 hover:text-red-300 font-medium"
            title="For testing: Disconnect Google Calendar"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      )}
      
      {!checkingAuth && isAuthenticated && error && (
        <div className="text-red-400">
          <p>{error}</p>
        </div>
      )}
      
      {!checkingAuth && isAuthenticated && !loading && !error && events.length === 0 && (
        <p>No upcoming events</p>
      )}
      
      {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => (
        <div key={dateStr} className="mb-4">
          <h3 className="text-lg font-medium mb-1">{formatEventDate(dateStr)}</h3>
          <ul className="space-y-2">
            {dayEvents.map(event => (
              <li key={event.id} className="bg-gray-800 p-2 rounded">
                <div className="flex justify-between">
                  <span className="font-medium">{event.summary}</span>
                  <span className="text-sm text-gray-300">{formatEventTime(event)}</span>
                </div>
                {event.location && <p className="text-sm text-gray-400">{event.location}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default CalendarWidget; 