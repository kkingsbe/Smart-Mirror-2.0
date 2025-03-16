import React, { useState, useEffect } from 'react';

interface WeatherMapProps {
  lat: number;
  lon: number;
  width?: number;
  height?: number;
  className?: string;
  refreshInterval?: number; // in minutes
  layer?: string; // Weather layer to display
  zoom?: number; // Zoom level
}

/**
 * A minimal weather map component that displays animated radar data using OpenWeatherMap's iframe.
 * Designed specifically for smart mirror displays with no visible controls.
 * The animation automatically plays and loops.
 */
const WeatherMap: React.FC<WeatherMapProps> = ({
  lat,
  lon,
  width = 400,
  height = 300,
  className = '',
  refreshInterval = 10, // refresh every 10 minutes
  layer = 'PAC0', // Default to precipitation
  zoom = 6,
}) => {
  const [key, setKey] = useState<number>(Date.now()); // Used to force iframe refresh
  
  // Function to refresh the iframe
  const refreshRadar = () => {
    setKey(Date.now());
  };
  
  // Set up refresh interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshRadar();
    }, refreshInterval * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);
  
  // Construct the iframe URL with additional parameters to hide UI elements
  const iframeUrl = `https://openweathermap.org/weathermap?basemap=map&cities=false&layer=${layer}&lat=${lat}&lon=${lon}&zoom=${zoom}&hideControls=true&hideUI=true`;
  
  return (
    <div 
      className={`weather-map ${className}`} 
      style={{ 
        width, 
        height,
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        position: 'relative',
      }}
    >
      {/* Overlay to block cookie consent dialogs */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40px', // Height to cover the cookie consent dialog
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          pointerEvents: 'none', // Allow clicks to pass through
        }}
      />
      
      <iframe 
        key={key}
        title="Weather Radar"
        width={width} 
        height={height} 
        src={iframeUrl}
        frameBorder="0"
        allowFullScreen
        style={{
          border: 'none',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          marginTop: '-40px', // Shift the iframe up to hide the top bar
        }}
      />
    </div>
  );
};

export default WeatherMap; 