'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const CalendarLinkQR = () => {
  const [authUrl, setAuthUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState('');
  
  useEffect(() => {
    // Get the current hostname to build the auth URL
    const hostname = window.location.origin;
    const url = `${hostname}/calendar/auth`;
    setAuthUrl(url);
    
    // Create a fallback URL for QR code using a public API
    setFallbackUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`);
  }, []);

  const handleOpenAuthPage = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Open in a popup window that's reasonably sized for mobile
    window.open(authUrl, 'calendarAuth', 'width=500,height=600');
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-10">
      {showQR ? (
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-black text-sm font-medium">Scan to Link Calendar</h3>
            <button 
              onClick={() => setShowQR(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="bg-white">
            {/* Primary QR code generator using qrcode.react */}
            {authUrl && (
              <div className="qr-code-container">
                {/* Using try-catch in React doesn't work for rendering errors, so we use both methods */}
                <QRCodeSVG 
                  value={authUrl}
                  size={160}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={false}
                />
                
                {/* Fallback in case the QRCodeSVG fails to render properly */}
                <img 
                  src={fallbackUrl}
                  alt="QR Code for Calendar Auth" 
                  className="w-40 h-40 hidden qr-fallback"
                  onError={(e) => {
                    // If the primary QR code fails, show this fallback
                    e.currentTarget.classList.remove('hidden');
                    const primaryElement = document.querySelector('.qr-code-container svg');
                    if (primaryElement) primaryElement.classList.add('hidden');
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-gray-600 text-xs mb-1">
              Scan with your phone to connect your Google Calendar
            </p>
            <a 
              href={authUrl}
              className="text-blue-600 text-xs underline"
              onClick={handleOpenAuthPage}
            >
              Or click here to open link
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowQR(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
          aria-label="Link Google Calendar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default CalendarLinkQR; 