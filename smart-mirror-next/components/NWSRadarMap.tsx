import React, { useState, useEffect, useRef } from 'react';

interface NWSRadarMapProps {
  lat: number;
  lon: number;
  width?: number;
  height?: number;
  className?: string;
  refreshInterval?: number; // in minutes
  zoom?: number; // Zoom level
  darkTheme?: boolean; // Whether to use dark theme
  frameCount?: number; // Number of frames to display
  frameInterval?: number; // Time between frames in minutes (default: 15)
  opacity?: number; // Opacity of the radar layer (0.0 to 1.0)
}

interface RadarFrame {
  timestamp: string;
  imageData: string;
  bbox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  opacity?: number;
}

/**
 * A weather radar map component that displays animated NWS radar data.
 * Uses the National Weather Service API for precipitation radar data
 * and overlays it on an OpenStreetMap base layer.
 * The animation automatically plays and loops.
 */
const NWSRadarMap: React.FC<NWSRadarMapProps> = ({
  lat,
  lon,
  width = 600,
  height = 500,
  className = '',
  refreshInterval = 10, // refresh every 10 minutes
  zoom = 7,
  darkTheme = true, // Default to dark theme for smart mirrors
  frameCount = 6, // Default to 6 frames
  frameInterval = 15, // Default to 15 minutes between frames
  opacity = 0.5, // Default to 50% opacity
}) => {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Calculate tile coordinates from lat/lon for the base map
  const calculateTileCoordinates = () => {
    // Convert lat/lon to tile coordinates
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    return { x, y };
  };
  
  // Fetch radar data from our API
  const fetchRadarData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Pass lat, lon, zoom, and opacity to the API to ensure proper alignment and appearance
      const response = await fetch(`/api/nws-radar?frameCount=${frameCount}&interval=${frameInterval}&lat=${lat}&lon=${lon}&zoom=${zoom}&opacity=${opacity}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch radar data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.frames || data.frames.length === 0) {
        throw new Error('No radar data available');
      }
      
      // Set the frames (newest to oldest)
      setFrames(data.frames.reverse());
      setCurrentFrame(0);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching radar data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch radar data');
      setIsLoading(false);
    }
  };
  
  // Initialize and set up refresh interval
  useEffect(() => {
    fetchRadarData();
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      fetchRadarData();
    }, refreshInterval * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [lat, lon, zoom, refreshInterval, frameCount, frameInterval, opacity]);
  
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
  
  // Get tile coordinates for the base map
  const tileCoords = calculateTileCoordinates();
  
  // Create a map background URL based on theme
  const mapUrl = `/api/osm-tile?z=${zoom}&x=${tileCoords.x}&y=${tileCoords.y}&darkTheme=${darkTheme}`;
  
  return (
    <div 
      ref={mapRef}
      className={`nws-radar-map ${className}`} 
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
          Loading NWS radar data...
        </div>
      ) : error ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          width: '100%',
          height: '100%',
          color: 'red',
          padding: '20px',
          textAlign: 'center',
        }}>
          Error: {error}
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
              src={frame.imageData}
              alt={`Weather radar frame ${index + 1}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: index === currentFrame ? opacity : 0,
                transition: 'opacity 0.2s ease-in-out',
                mixBlendMode: darkTheme ? 'screen' : 'normal', // Improve visibility on dark backgrounds
              }}
            />
          ))}
          
          {/* Frame timestamp indicator */}
          {frames.length > 0 && currentFrame < frames.length && (
            <div style={{
              position: 'absolute',
              bottom: 5,
              right: 5,
              fontSize: '10px',
              color: 'white',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '3px 6px',
              borderRadius: '3px',
            }}>
              {new Date(frames[currentFrame].timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          )}
          
          {/* NWS API indicator */}
          <div style={{
            position: 'absolute',
            bottom: 5,
            left: 5,
            fontSize: '10px',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '3px 6px',
            borderRadius: '3px',
          }}>
            NWS Radar
          </div>
          
          {/* Frame interval indicator */}
          <div style={{
            position: 'absolute',
            top: 5,
            right: 5,
            fontSize: '10px',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '3px 6px',
            borderRadius: '3px',
          }}>
            {frameInterval}min intervals
          </div>
        </>
      )}
    </div>
  );
};

export default NWSRadarMap; 