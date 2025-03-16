import React, { useState, useEffect, useRef } from 'react';
import { NWSRadarMapProps, RadarFrame, WeatherAlert, AlertCounts } from './types';
import { calculateTileCoordinates, sortAlertsBySeverity } from './utils';
import BaseMap from './BaseMap';
import RadarOverlay from './RadarOverlay';
import WeatherAlerts from './WeatherAlerts';
import LocationMarker from './LocationMarker';

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
  showLocationMarker = true, // Default to showing the location marker
}) => {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<number>(0);
  const [alertCounts, setAlertCounts] = useState<AlertCounts>({});
  const animationRef = useRef<number | null>(null);
  const alertAnimationRef = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Calculate tile coordinates from lat/lon for the base map
  const tileCoords = calculateTileCoordinates(lat, lon, zoom);
  
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
  
  // Fetch weather alerts for the location
  const fetchWeatherAlerts = async () => {
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
        
        // Count alerts by type
        const counts: AlertCounts = {};
        sortedAlerts.forEach((alert: WeatherAlert) => {
          const eventType = alert.event;
          counts[eventType] = (counts[eventType] || 0) + 1;
        });
        
        setAlertCounts(counts);
        setAlerts(sortedAlerts);
        setCurrentAlert(0);
      } else {
        setAlerts([]);
        setAlertCounts({});
      }
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      setAlerts([]);
      setAlertCounts({});
    }
  };
  
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (alertAnimationRef.current) {
        cancelAnimationFrame(alertAnimationRef.current);
      }
    };
  }, [lat, lon, zoom, refreshInterval, frameCount, frameInterval, opacity]);
  
  // Animation loop for radar frames
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
  
  // Animation loop for alerts
  useEffect(() => {
    if (alerts.length === 0) return;
    
    const animateAlerts = () => {
      // Change alert every 8 seconds
      const intervalId = setInterval(() => {
        setCurrentAlert(prev => (prev + 1) % alerts.length);
      }, 8000);
      
      return () => clearInterval(intervalId);
    };
    
    const cleanup = animateAlerts();
    
    return () => {
      cleanup();
    };
  }, [alerts]);
  
  return (
    <>
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
            <BaseMap 
              tileCoords={tileCoords}
              width={width}
              height={height}
              zoom={zoom}
              darkTheme={darkTheme}
            />
            
            {/* Radar frames */}
            <RadarOverlay 
              frames={frames}
              currentFrame={currentFrame}
              opacity={opacity}
              darkTheme={darkTheme}
            />
            
            {/* Location marker */}
            {showLocationMarker && <LocationMarker />}
            
            {/* NWS API indicator */}
            <div style={{
              position: 'absolute',
              bottom: 5,
              left: 5,
              fontSize: '1.2rem',
              color: 'white',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '3px 6px',
              borderRadius: '3px',
              zIndex: 100
            }}>
              NWS Radar
            </div>
            
            {/* Frame interval indicator */}
            <div style={{
              position: 'absolute',
              top: 5,
              right: 5,
              fontSize: '1.2rem',
              color: 'white',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '3px 6px',
              borderRadius: '3px',
              zIndex: 100
            }}>
              {frameInterval}min intervals
            </div>
          </>
        )}
      </div>
      
      {/* Weather Alerts Display - Now positioned below the radar map */}
      {!isLoading && !error && alerts.length > 0 && (
        <div style={{ marginTop: '10px', width }}>
          <WeatherAlerts 
            alerts={alerts}
            currentAlert={currentAlert}
            alertCounts={alertCounts}
          />
        </div>
      )}
    </>
  );
};

export default NWSRadarMap; 