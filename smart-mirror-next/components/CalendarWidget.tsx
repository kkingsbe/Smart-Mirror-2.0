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

  // Group events by date - now only focus on today's events
  const groupedEvents = events.reduce((groups: Record<string, CalendarEvent[]>, event) => {
    const dateKey = event.start.dateTime 
      ? new Date(event.start.dateTime).toDateString() 
      : (event.start.date ? new Date(event.start.date).toDateString() : 'Unknown');
    
    // Only show today's events
    const today = new Date().toDateString();
    if (dateKey === today) {
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(event);
    }
    return groups;
  }, {});

  // Helper function to sort events by time
  const sortEventsByTime = (events: CalendarEvent[]) => {
    return [...events].sort((a, b) => {
      const aTime = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0;
      const bTime = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
      return aTime - bTime;
    });
  };

  // Get current time for displaying the time indicator
  const now = new Date();
  const currentTimeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Function to determine if an event is happening now
  const isEventHappeningNow = (event: CalendarEvent) => {
    if (!event.start.dateTime || !event.end.dateTime) return false;
    
    const startTime = new Date(event.start.dateTime).getTime();
    const endTime = new Date(event.end.dateTime).getTime();
    const currentTime = now.getTime();
    
    return currentTime >= startTime && currentTime <= endTime;
  };

  // Function to determine if an event has passed
  const isEventPassed = (event: CalendarEvent) => {
    if (!event.end.dateTime) return false;
    
    const endTime = new Date(event.end.dateTime).getTime();
    const currentTime = now.getTime();
    
    return currentTime > endTime;
  };

  return (
    <div className="p-4 bg-black bg-opacity-90 rounded-lg w-full border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-cyan-300">Today's Events</h2>
      
      {checkingAuth && <p className="text-white">Initializing calendar connection...</p>}
      
      {!checkingAuth && !isAuthenticated && mirrorToken && (
        <div className="text-center">
          <p className="text-red-400 mb-3">Calendar not connected</p>
          <p className="text-sm text-white mb-3">To connect your calendar, scan this QR code with your phone:</p>
          <div className="bg-white p-3 rounded-lg mb-3 mx-auto w-fit">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/calendar/link/${mirrorToken}`)}`}
              alt="QR Code for linking calendar" 
              className="w-36 h-36"
            />
          </div>
          <p className="text-xs text-gray-400">
            Or visit: <span className="text-cyan-400 break-all">{`${window.location.origin}/calendar/link/${mirrorToken}`}</span>
          </p>
        </div>
      )}
      
      {!checkingAuth && isAuthenticated && loading && <p className="text-white">Loading calendar events...</p>}
      
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
        <p className="text-white">No events today</p>
      )}
      
      {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => {
        const sortedEvents = sortEventsByTime(dayEvents);
        let currentTimeLine: React.ReactNode = null;
        
        // Find if we need to insert the current time indicator
        let timeInserted = false;
        
        return (
          <div key={dateStr} className="mb-4">
            <h3 className="text-lg font-medium mb-1 text-magenta-400">{formatEventDate(dateStr)}</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 relative">
              {sortedEvents.map((event, index) => {
                // Add current time indicator logic
                if (!timeInserted && event.start.dateTime) {
                  const eventStart = new Date(event.start.dateTime);
                  const prevEvent = index > 0 ? sortedEvents[index-1] : null;
                  const isPrevEventEnded = prevEvent && 
                                          prevEvent.end.dateTime && 
                                          now > new Date(prevEvent.end.dateTime);
                  
                  if (now < eventStart && (index === 0 || isPrevEventEnded)) {
                    // Insert time indicator before this event
                    timeInserted = true;
                    currentTimeLine = (
                      <div key="current-time" className="col-span-full w-full border-t-2 border-magenta-500 my-2 relative">
                        <span className="absolute top-0 right-0 transform -translate-y-1/2 bg-black px-1 rounded text-magenta-400 text-xs border border-magenta-500">
                          {currentTimeFormatted}
                        </span>
                      </div>
                    );
                  }
                }
                
                // Add highlight for events happening now or styling for past events
                const isHappeningNow = isEventHappeningNow(event);
                const isPassed = isEventPassed(event);
                
                // Check if event has valid start dateTime before comparing
                const hasValidStartTime = event.start.dateTime !== undefined;
                
                return (
                  <React.Fragment key={event.id}>
                    {index === 0 && !timeInserted && hasValidStartTime && now < new Date(event.start.dateTime!) && (
                      <div className="col-span-full w-full border-t-2 border-magenta-500 my-2 relative">
                        <span className="absolute top-0 right-0 transform -translate-y-1/2 bg-black px-1 rounded text-magenta-400 text-xs border border-magenta-500">
                          {currentTimeFormatted}
                        </span>
                      </div>
                    )}
                    {currentTimeLine}
                    <li className={`bg-black border border-gray-800 p-2 rounded 
                      ${isHappeningNow ? 'border-l-4 border-l-cyan-500' : ''} 
                      ${isPassed ? 'opacity-40' : ''}`}
                    >
                      <div className="flex justify-between">
                        <span className={`font-medium ${isHappeningNow ? 'text-cyan-300' : 'text-white'}`}>{event.summary}</span>
                        <span className="text-sm text-cyan-400 whitespace-nowrap ml-2">{formatEventTime(event)}</span>
                      </div>
                      {event.location && <p className="text-sm text-gray-400 truncate">{event.location}</p>}
                    </li>
                    {/* Reset current time line after using it */}
                    {(() => { currentTimeLine = null; return null; })()}
                  </React.Fragment>
                );
              })}
              
              {/* If time hasn't been inserted yet and we've gone through all events, add it at the end */}
              {!timeInserted && sortedEvents.length > 0 && 
               sortedEvents[sortedEvents.length-1].end.dateTime !== undefined && 
               now > new Date(sortedEvents[sortedEvents.length-1].end.dateTime!) && (
                <div className="col-span-full w-full border-t-2 border-magenta-500 my-2 relative">
                  <span className="absolute top-0 right-0 transform -translate-y-1/2 bg-black px-1 rounded text-magenta-400 text-xs border border-magenta-500">
                    {currentTimeFormatted}
                  </span>
                </div>
              )}
              
              {/* If no events, just show the time line */}
              {sortedEvents.length === 0 && (
                <div className="col-span-full w-full border-t-2 border-magenta-500 my-2 relative">
                  <span className="absolute top-0 right-0 transform -translate-y-1/2 bg-black px-1 rounded text-magenta-400 text-xs border border-magenta-500">
                    {currentTimeFormatted}
                  </span>
                </div>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarWidget; 