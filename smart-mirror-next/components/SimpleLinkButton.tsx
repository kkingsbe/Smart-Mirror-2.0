'use client';

import React, { useState, useEffect } from 'react';

const SimpleLinkButton = () => {
  const [authUrl, setAuthUrl] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  
  useEffect(() => {
    // Get the current hostname to build the auth URL
    const hostname = window.location.origin;
    setAuthUrl(`${hostname}/calendar/auth`);
  }, []);

  const handleOpenAuthPage = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Open in a popup window that's reasonably sized for mobile
    window.open(authUrl, 'calendarAuth', 'width=500,height=600');
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-10">
      {showPanel ? (
        <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-black text-sm font-medium">Link Google Calendar</h3>
            <button 
              onClick={() => setShowPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">
            To connect your Google Calendar to the Smart Mirror, visit this URL on your phone:
          </p>
          
          <div className="bg-gray-100 p-2 rounded break-all mb-3">
            <code className="text-xs text-gray-800">{authUrl}</code>
          </div>
          
          <div className="flex justify-center">
            <a 
              href={authUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm text-center inline-block"
              onClick={handleOpenAuthPage}
            >
              Open Link
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPanel(true)}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg"
          aria-label="Link Google Calendar Text Instructions"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SimpleLinkButton; 