import React, { useState, useEffect, useRef } from 'react';

interface RadarMapProps {
  lat: number;
  lon: number;
  width?: number;
  height?: number;
  className?: string;
  refreshInterval?: number; // in minutes
  layer?: string; // Weather layer to display
  zoom?: number; // Zoom level
  darkTheme?: boolean; // Whether to use dark theme
  highResolution?: boolean; // Whether to use high resolution tiles
  ultraHighResolution?: boolean; // Whether to use ultra-high resolution
  extremeResolution?: boolean; // Whether to use extreme resolution
  frameInterval?: number; // Time between frames in minutes
}

/**
 * A clean weather radar map component that displays animated radar data.
 * Uses a proxy API to fetch tiles from OpenWeatherMap 2.0 API without any UI elements or cookie dialogs.
 * The animation automatically plays and loops.
 */
const RadarMap: React.FC<RadarMapProps> = ({
  lat,
  lon,
  width = 400,
  height = 300,
  className = '',
  refreshInterval = 10, // refresh every 10 minutes
  layer = 'PA0', // Default to accumulated precipitation
  zoom = 6,
  darkTheme = true, // Default to dark theme for smart mirrors
  highResolution = false, // Default to standard resolution
  ultraHighResolution = false, // Default to standard resolution
  extremeResolution = false, // Default to standard resolution
  frameInterval = 60, // Default to 60 minutes between frames (for 2.0 API)
}) => {
  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const animationRef = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Map old layer names to new 2.0 API layer codes
  const getLayerCode = (oldLayer: string): string => {
    const layerMap: Record<string, string> = {
      'precipitation_new': 'PA0', // Accumulated precipitation
      'clouds_new': 'CL',         // Cloudiness
      'pressure_new': 'APM',      // Atmospheric pressure on mean sea level
      'wind_new': 'WND',          // Wind speed and direction
      'temp_new': 'TA2',          // Air temperature at a height of 2 meters
      // Add direct 2.0 API layers
      'PA0': 'PA0',   // Accumulated precipitation
      'PR0': 'PR0',   // Precipitation intensity
      'PAC0': 'PAC0', // Convective precipitation
      'CL': 'CL',     // Cloudiness
      'APM': 'APM',   // Atmospheric pressure
      'WND': 'WND',   // Wind speed and direction
      'TA2': 'TA2',   // Air temperature
      'HRD0': 'HRD0', // Relative humidity
    };
    
    return layerMap[oldLayer] || 'PA0';
  };
  
  // Adjust zoom level based on resolution settings
  let effectiveZoom = zoom;
  if (extremeResolution) {
    effectiveZoom = Math.min(zoom + 4, 14); // Extreme resolution (up to zoom level 14)
  } else if (ultraHighResolution) {
    effectiveZoom = Math.min(zoom + 3, 12); // Ultra-high resolution (up to zoom level 12)
  } else if (highResolution) {
    effectiveZoom = Math.min(zoom + 2, 10); // High resolution (up to zoom level 10)
  }
  
  // Generate frames for the animation
  const generateFrames = () => {
    setIsLoading(true);
    
    // Calculate tile coordinates from lat/lon
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, effectiveZoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, effectiveZoom));
    
    // Generate timestamps for frames (frameInterval minutes apart)
    // OpenWeatherMap 2.0 API uses 3-hour intervals, so we'll adjust accordingly
    const now = Math.floor(Date.now() / 1000);
    const frameCount = 8; // Show 8 frames (8 hours with 1-hour intervals)
    const intervalSeconds = frameInterval * 60; // Convert minutes to seconds
    const timestamps = Array.from({ length: frameCount }, (_, i) => now - (i * intervalSeconds));
    
    // Convert old layer names to new 2.0 API layer codes
    const layerCode = getLayerCode(layer);
    
    // Generate frame URLs using our proxy API
    const newFrames = timestamps.map(timestamp => {
      return `/api/radar-tile?layer=${layerCode}&zoom=${effectiveZoom}&x=${x}&y=${y}&timestamp=${timestamp}&highRes=${highResolution || ultraHighResolution || extremeResolution}&extremeRes=${extremeResolution}`;
    });
    
    setFrames(newFrames.reverse()); // Reverse to show oldest first
    setIsLoading(false);
    setCurrentFrame(0);
  };
  
  // Initialize frames
  useEffect(() => {
    generateFrames();
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      generateFrames();
    }, refreshInterval * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [lat, lon, effectiveZoom, layer, refreshInterval, highResolution, ultraHighResolution, extremeResolution, frameInterval]);
  
  // Animation loop
  useEffect(() => {
    if (frames.length === 0) return;
    
    const animate = () => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
      animationRef.current = requestAnimationFrame(() => {
        // Add a delay between frames
        setTimeout(animate, 500); // 500ms between frames
      });
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frames]);
  
  // Create a map background URL based on theme
  // For dark theme, use a dark-styled map from CartoDB
  // For high resolution, use a higher zoom level
  const mapUrl = darkTheme 
    ? `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${effectiveZoom}/${Math.floor((lon + 180) / 360 * Math.pow(2, effectiveZoom))}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, effectiveZoom))}.png`
    : `https://tile.openstreetmap.org/${effectiveZoom}/${Math.floor((lon + 180) / 360 * Math.pow(2, effectiveZoom))}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, effectiveZoom))}.png`;
  
  return (
    <div 
      ref={mapRef}
      className={`radar-map ${className}`} 
      style={{ 
        width, 
        height,
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: darkTheme ? '#121212' : 'rgba(0, 0, 0, 0.3)',
        position: 'relative',
      }}
    >
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          width: '100%',
          height: '100%',
          color: 'white',
        }}>
          Loading radar...
        </div>
      ) : (
        <>
          {/* Base map layer */}
          <img 
            src={mapUrl} 
            alt="Map background"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: darkTheme ? 'brightness(0.8) contrast(1.2)' : 'none', // Enhance dark theme
            }}
          />
          
          {/* Radar frames */}
          {frames.map((frame, index) => (
            <img
              key={index}
              src={frame}
              alt={`Weather radar frame ${index + 1}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: index === currentFrame ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
                mixBlendMode: darkTheme ? 'screen' : 'normal', // Improve visibility on dark backgrounds
              }}
            />
          ))}
          
          {/* Resolution indicator */}
          {(highResolution || ultraHighResolution || extremeResolution) && (
            <div style={{
              position: 'absolute',
              top: 5,
              left: 5,
              fontSize: '8px',
              color: 'white',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '2px 4px',
              borderRadius: '2px',
            }}>
              {extremeResolution ? 'EXTREME HD' : (ultraHighResolution ? 'ULTRA HD' : 'HD')}
            </div>
          )}
          
          {/* Frame interval indicator */}
          <div style={{
            position: 'absolute',
            top: 5,
            right: 5,
            fontSize: '8px',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '2px 4px',
            borderRadius: '2px',
          }}>
            {frameInterval}min
          </div>
          
          {/* API Version indicator */}
          <div style={{
            position: 'absolute',
            bottom: 5,
            left: 5,
            fontSize: '8px',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '2px 4px',
            borderRadius: '2px',
          }}>
            API 2.0
          </div>
          
          {/* Attribution */}
          <div style={{
            position: 'absolute',
            bottom: 5,
            right: 5,
            fontSize: '8px',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '2px 4px',
            borderRadius: '2px',
          }}>
            © OpenWeatherMap {darkTheme ? '| Dark theme by CartoDB' : ''}
          </div>
        </>
      )}
    </div>
  );
};

export default RadarMap; 