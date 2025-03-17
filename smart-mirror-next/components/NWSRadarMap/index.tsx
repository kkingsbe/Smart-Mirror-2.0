import React, { useRef, useEffect, useState } from 'react';
import { NWSRadarMapProps } from './types';
import { calculateTileCoordinates } from './utils';
import BaseMap from './BaseMap';
import RadarOverlay from './RadarOverlay';
import WeatherAlerts from './WeatherAlerts';
import LocationMarker from './LocationMarker';
import FlightOverlay from './FlightOverlay';
import { MapStatus } from './MapStatus';
import { useRadarData } from './hooks/useRadarData';
import { useWeatherAlerts } from './hooks/useWeatherAlerts';
import { useFlightData } from './hooks/useFlightData';
import { useVisibility } from './hooks/useVisibility';

/**
 * Determines if colors should be inverted based on time of day
 * Returns true between 8am and 6pm, false otherwise
 */
const shouldInvertColors = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  // Invert colors between 8am (8) and 6pm (18)
  return hour >= 8 && hour < 18;
};

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
  zoom = 7,
  darkTheme = true, // Default to dark theme for smart mirrors
  frameCount = 6, // Default to 6 frames
  frameInterval = 15, // Default to 15 minutes between frames
  opacity = 0.5, // Default to 50% opacity
  showLocationMarker = true, // Default to showing the location marker
  invertColors, // Allow override through props
  showFlights = true, // Default to showing flight data on the map
}) => {
  const mapRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [baseMapLoaded, setBaseMapLoaded] = useState<boolean>(false);
  const [timeBasedInvertColors, setTimeBasedInvertColors] = useState<boolean>(shouldInvertColors());

  // Update invertColors based on time of day
  useEffect(() => {
    // Initial setting
    setTimeBasedInvertColors(shouldInvertColors());
    
    // Update every minute
    const intervalId = setInterval(() => {
      setTimeBasedInvertColors(shouldInvertColors());
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Calculate tile coordinates from lat/lon for the base map
  const tileCoords = calculateTileCoordinates(lat, lon, zoom);

  // Handle base map loaded event
  const handleBaseMapLoaded = () => {
    setBaseMapLoaded(true);
  };

  // Use prop value if provided, otherwise use time-based value
  const effectiveInvertColors = invertColors !== undefined ? invertColors : timeBasedInvertColors;

  // Handle visibility and animations
  const { isVisible, animationTimeoutRef } = useVisibility({
    mapRef,
    onVisibilityChange: (visible) => {
      if (!visible) {
        // Pause animations when hidden
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      }
    },
  });

  // Handle radar data
  const {
    frames,
    loadedFrames,
    currentFrame,
    setCurrentFrame,
    isLoading,
    error,
    animationPaused,
    setupRefreshInterval,
    fetchRadarData,
  } = useRadarData({
    lat,
    lon,
    zoom,
    frameCount,
    frameInterval,
    opacity,
    isVisible,
  });

  // Handle weather alerts
  const {
    alerts,
    currentAlert,
  } = useWeatherAlerts({
    lat,
    lon,
    isVisible,
  });

  // Handle flight data
  const {
    flights,
    error: flightError,
    setupRefreshInterval: setupFlightRefreshInterval,
  } = useFlightData({
    isVisible,
    refreshInterval: 15, // refresh flight data every 15 seconds
    lat,
    lon,
    radius: 200, // 200nm radius
  });

  // Initialize data fetching and animations
  useEffect(() => {
    if (!isVisible) return;

    const cleanupRadar = setupRefreshInterval();
    const cleanupFlights = showFlights ? setupFlightRefreshInterval() : undefined;

    return () => {
      cleanupRadar?.();
      cleanupFlights?.();
    };
  }, [isVisible, setupRefreshInterval, showFlights, setupFlightRefreshInterval]);

  // Animate the radar frames
  useEffect(() => {
    // Don't animate if there are no frames, if we're still loading, or if animation is paused
    if (frames.length === 0 || isLoading || animationPaused || !baseMapLoaded) {
      return;
    }
    
    console.log(`Animating frame ${currentFrame} of ${frames.length}`);
    
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    // Calculate the delay before showing the next frame
    let delay = 1000; // Default 1 second between frames
    
    // If we're on the last frame (which is actually index frames.length - 1), use a longer delay
    if (currentFrame === frames.length - 1) {
      delay = 3000; // 3 second pause on the last frame
    }
    
    // Set up timeout for the next frame
    animationTimeoutRef.current = setTimeout(() => {
      // Advance to the next frame (or loop back to the first frame)
      const nextFrame = (currentFrame + 1) % frames.length;
      setCurrentFrame(nextFrame);
    }, delay);
    
    // Clean up on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [frames, currentFrame, isLoading, animationPaused, baseMapLoaded, setCurrentFrame, animationTimeoutRef]);

  // Add debugging for production issues
  useEffect(() => {
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
      <MapStatus 
        isLoading={isLoading}
        error={error}
        onRetry={fetchRadarData}
      />
      
      {!error && (
        <>
          {/* Base map layer */}
          <BaseMap 
            tileCoords={tileCoords}
            width={width}
            height={height}
            zoom={zoom}
            darkTheme={darkTheme}
            contrast={effectiveInvertColors ? 1.2 : 0.8}
            invertColors={effectiveInvertColors}
            onLoaded={handleBaseMapLoaded}
          />
          
          {/* Weather alerts - moved above radar */}
          {alerts.length > 0 && (
            <WeatherAlerts 
              alerts={alerts} 
              currentAlert={currentAlert}
            />
          )}
          
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
          
          {/* Flight overlay */}
          {showFlights && baseMapLoaded && !flightError && (
            <>
              <FlightOverlay
                flights={flights}
                tileCoords={tileCoords}
                mapWidth={width}
                mapHeight={height}
                zoom={zoom}
                darkTheme={darkTheme}
                invertColors={effectiveInvertColors}
                offsetCorrection={{ x: 0, y: 0 }} // Adjust if needed for calibration
              />
            </>
          )}
          
          {/* Location marker */}
          {showLocationMarker && baseMapLoaded && <LocationMarker />}
        </>
      )}
    </div>
  );
};

export default NWSRadarMap; 