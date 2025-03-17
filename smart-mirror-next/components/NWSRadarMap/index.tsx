import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NWSRadarMapProps, RadarFrame, WeatherAlert } from './types';
import { calculateTileCoordinates, sortAlertsBySeverity } from './utils';
import BaseMap from './BaseMap';
import RadarOverlay from './RadarOverlay';
import WeatherAlerts from './WeatherAlerts';
import LocationMarker from './LocationMarker';

/**
 * A weather radar map component that displays animated NWS radar data.
 * Uses the National Weather Service API for precipitation radar data
 * and overlays it on an OpenStreetMap base layer.
 * Optimized for performance on slower devices like Raspberry Pi.
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
  showLocationMarker = true, // Default to showing the location marker
}) => {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [loadedFrames, setLoadedFrames] = useState<boolean[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<number>(0);
  const [baseMapLoaded, setBaseMapLoaded] = useState<boolean>(false);
  const [animationPaused, setAnimationPaused] = useState<boolean>(false);
  const animationRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const alertAnimationRef = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const fetchRetryCount = useRef<number>(0);
  const maxRetries = 3;
  
  // Calculate tile coordinates from lat/lon for the base map
  const tileCoords = calculateTileCoordinates(lat, lon, zoom);
  
  // Add debugging for production issues
  useEffect(() => {
    // Log coordinates in both development and production to help debug the issue
    console.log('NWSRadarMap initialized with:', { 
      lat, 
      lon, 
      zoom, 
      tileCoords,
      environment: process.env.NODE_ENV,
      windowSize: typeof window !== 'undefined' ? { 
        width: window.innerWidth, 
        height: window.innerHeight 
      } : null,
      deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    });
  }, [lat, lon, zoom, tileCoords]);
  
  // Fetch radar data from our API with retry logic
  const fetchRadarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Pause animation while fetching new data
      setAnimationPaused(true);
      
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
      
      // Reset retry count on successful fetch
      fetchRetryCount.current = 0;
      
      // Set the frames (newest to oldest)
      const newFrames = data.frames.reverse();
      setFrames(newFrames);
      
      // Initialize the loadedFrames array with false values
      setLoadedFrames(new Array(newFrames.length).fill(false));
      setCurrentFrame(0);
      
      // Resume animation after a short delay to allow the base map to stabilize
      setTimeout(() => {
        setAnimationPaused(false);
      }, 1000);
      
      // Don't set isLoading to false yet - we'll do that when all frames are loaded
    } catch (error) {
      console.error('Error fetching radar data:', error);
      
      // Implement retry logic
      if (fetchRetryCount.current < maxRetries) {
        fetchRetryCount.current++;
        console.log(`Retrying radar data fetch (${fetchRetryCount.current}/${maxRetries})...`);
        
        // Exponential backoff for retries
        setTimeout(() => {
          fetchRadarData();
        }, 2000 * Math.pow(2, fetchRetryCount.current - 1));
      } else {
        setError(error instanceof Error ? error.message : 'Failed to fetch radar data');
        setIsLoading(false);
        setAnimationPaused(false);
      }
    }
  }, [lat, lon, zoom, frameCount, frameInterval, opacity]);
  
  // Fetch weather alerts for the location
  const fetchWeatherAlerts = useCallback(async () => {
    try {
      // Fetch alerts within 20 miles of the location
      const response = await fetch(`/api/nws-alerts?lat=${lat}&lon=${lon}&radius=20`);
      
      if (!response.ok) {
        console.error(`Failed to fetch weather alerts: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.alerts && Array.isArray(data.alerts)) {
        // Sort alerts by severity (most severe first)
        const sortedAlerts = sortAlertsBySeverity(data.alerts);
        
        setAlerts(sortedAlerts);
        setCurrentAlert(0);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      // Don't show an error for alerts - they're not critical
    }
  }, [lat, lon]);
  
  // Initialize and set up refresh interval
  useEffect(() => {
    fetchRadarData();
    fetchWeatherAlerts();
    
    // Set up refresh interval
    const radarIntervalId = setInterval(() => {
      fetchRadarData();
    }, refreshInterval * 60 * 1000);
    
    // Refresh alerts every 5 minutes
    const alertsIntervalId = setInterval(() => {
      fetchWeatherAlerts();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(radarIntervalId);
      clearInterval(alertsIntervalId);
      // Store refs in variables to avoid the cleanup function capturing stale refs
      const animationRefValue = animationRef.current;
      const alertAnimationRefValue = alertAnimationRef.current;
      
      if (animationRefValue) {
        cancelAnimationFrame(animationRefValue);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (alertAnimationRefValue) {
        cancelAnimationFrame(alertAnimationRefValue);
      }
    };
  }, [lat, lon, zoom, refreshInterval, frameCount, frameInterval, opacity, fetchRadarData, fetchWeatherAlerts]);
  
  // Preload all radar frame images
  useEffect(() => {
    if (frames.length === 0) return;
    
    // Create an array to track which frames have been loaded
    const newLoadedFrames = [...loadedFrames];
    let loadedCount = newLoadedFrames.filter(loaded => loaded).length;
    
    // Preload all images
    frames.forEach((frame, index) => {
      if (newLoadedFrames[index]) return; // Skip already loaded frames
      
      const img = new window.Image();
      img.onload = () => {
        newLoadedFrames[index] = true;
        loadedCount++;
        
        // Update the loadedFrames state
        setLoadedFrames([...newLoadedFrames]);
        
        // If all frames are loaded, set allFramesLoaded to true
        if (loadedCount === frames.length) {
          setIsLoading(false);
        }
      };
      
      img.onerror = () => {
        console.error(`Failed to load radar frame ${index}`);
        // Mark as loaded anyway to prevent infinite loading state
        newLoadedFrames[index] = true;
        loadedCount++;
        
        // Update the loadedFrames state
        setLoadedFrames([...newLoadedFrames]);
        
        // If all frames are loaded, set allFramesLoaded to true
        if (loadedCount === frames.length) {
          setIsLoading(false);
        }
      };
      
      img.src = frame.imageData;
    });
    
    // If there are no frames to load, set allFramesLoaded to true
    if (frames.length === 0) {
      setIsLoading(false);
    }
  }, [frames]);
  
  // Handle base map loaded event
  const handleBaseMapLoaded = () => {
    setBaseMapLoaded(true);
  };
  
  // Animate the radar frames
  useEffect(() => {
    // Don't animate if there are no frames, if we're still loading, or if animation is paused
    if (frames.length === 0 || isLoading || animationPaused) {
      return;
    }
    
    // Don't start animation until base map is loaded
    if (!baseMapLoaded) {
      return;
    }
    
    // Function to advance to the next frame
    const advanceFrame = () => {
      setCurrentFrame((prevFrame) => (prevFrame + 1) % frames.length);
    };
    
    // Set up the animation loop with a fixed frame rate of 5 seconds per frame
    const frameRate = 5000; // 5 seconds per frame
    
    // Clear any existing animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // Set up the next frame
    animationTimeoutRef.current = setTimeout(() => {
      advanceFrame();
    }, frameRate);
    
    // Clean up on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [frames, currentFrame, isLoading, animationPaused, baseMapLoaded, loadedFrames]);
  
  // Animate the weather alerts
  useEffect(() => {
    if (alerts.length <= 1) return;
    
    const advanceAlert = () => {
      setCurrentAlert((prevAlert) => (prevAlert + 1) % alerts.length);
    };
    
    // Change alert every 5 seconds
    const alertInterval = setInterval(advanceAlert, 5000);
    
    return () => {
      clearInterval(alertInterval);
    };
  }, [alerts]);
  
  return (
    <div
      ref={mapRef}
      className={className}
      style={{
        position: 'relative',
        width: width,
        height: height,
        overflow: 'hidden',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          zIndex: 1000,
          fontSize: '1.5rem',
        }}>
          Loading radar...
        </div>
      )}
      
      {error ? (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: 'red',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
        }}>
          Error: {error}
          <button 
            onClick={() => {
              fetchRetryCount.current = 0;
              fetchRadarData();
            }}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Base map layer */}
          <BaseMap 
            tileCoords={tileCoords}
            width={width}
            height={height}
            zoom={zoom}
            darkTheme={darkTheme}
            onLoaded={handleBaseMapLoaded}
          />
          
          {/* Radar frames */}
          {baseMapLoaded && (
            <RadarOverlay 
              frames={frames}
              currentFrame={currentFrame}
              opacity={opacity}
              darkTheme={darkTheme}
              loadedFrames={loadedFrames}
            />
          )}
          
          {/* Location marker */}
          {showLocationMarker && baseMapLoaded && <LocationMarker />}
          
          {/* Weather alerts */}
          {alerts.length > 0 && (
            <WeatherAlerts 
              alerts={alerts} 
              currentAlert={currentAlert}
            />
          )}
        </>
      )}
    </div>
  );
};

export default NWSRadarMap; 