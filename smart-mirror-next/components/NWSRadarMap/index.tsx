import React, { useState, useEffect, useRef } from 'react';
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
  const [loadedFrames, setLoadedFrames] = useState<boolean[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<number>(0);
  const [allFramesLoaded, setAllFramesLoaded] = useState<boolean>(false);
  const animationRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const alertAnimationRef = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
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
      } : null
    });
    
    // Check if we're in production and add a visible error message for debugging
    if (process.env.NODE_ENV === 'production') {
      const debugElement = document.createElement('div');
      debugElement.style.position = 'fixed';
      debugElement.style.bottom = '10px';
      debugElement.style.right = '10px';
      debugElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
      debugElement.style.color = 'white';
      debugElement.style.padding = '5px';
      debugElement.style.fontSize = '10px';
      debugElement.style.zIndex = '9999';
      debugElement.style.maxWidth = '300px';
      debugElement.style.overflow = 'auto';
      debugElement.textContent = `Map Debug: lat=${lat}, lon=${lon}, zoom=${zoom}, tileX=${tileCoords.x}, tileY=${tileCoords.y}`;
      document.body.appendChild(debugElement);
      
      // Add a reload button for when tiles fail to load
      const reloadButton = document.createElement('button');
      reloadButton.textContent = 'Reload Map';
      reloadButton.style.marginTop = '5px';
      reloadButton.style.padding = '3px';
      reloadButton.style.backgroundColor = '#007bff';
      reloadButton.style.border = 'none';
      reloadButton.style.borderRadius = '3px';
      reloadButton.style.color = 'white';
      reloadButton.style.cursor = 'pointer';
      reloadButton.onclick = () => {
        // Force reload the map by clearing cache
        localStorage.setItem('mapReloadTimestamp', Date.now().toString());
        window.location.reload();
      };
      debugElement.appendChild(document.createElement('br'));
      debugElement.appendChild(reloadButton);
      
      // Remove after 5 minutes
      setTimeout(() => {
        if (document.body.contains(debugElement)) {
          document.body.removeChild(debugElement);
        }
      }, 300000); // 5 minutes
    }
  }, [lat, lon, zoom, tileCoords]);
  
  // Add a fallback mechanism for production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Store a reference to the fallback element to avoid creating multiple
      let fallbackMap: HTMLDivElement | null = null;
      let fallbackCreated = false;
      
      // Check if tiles are loading after a reasonable time
      const checkTilesTimeout = setTimeout(() => {
        // Get all map tile images
        const mapTiles = document.querySelectorAll('.nws-radar-map img');
        let loadedCount = 0;
        
        // Count loaded tiles
        mapTiles.forEach(tile => {
          if ((tile as HTMLImageElement).complete && (tile as HTMLImageElement).naturalHeight !== 0) {
            loadedCount++;
          }
        });
        
        console.log(`Tile loading check: ${loadedCount} of ${mapTiles.length} tiles loaded`);
        
        // If less than 25% of tiles loaded and we have at least some tiles to check, try fallback approach
        if (mapTiles.length > 5 && loadedCount / mapTiles.length < 0.25) {
          console.error('Tile loading issue detected in production - trying fallback');
          
          // Only create fallback if it doesn't already exist
          if (!fallbackCreated) {
            fallbackCreated = true;
            
            // Create a fallback static map as a temporary solution
            fallbackMap = document.createElement('div');
            fallbackMap.id = 'radar-fallback-map';
            fallbackMap.style.position = 'absolute';
            fallbackMap.style.top = '0';
            fallbackMap.style.left = '0';
            fallbackMap.style.width = '100%';
            fallbackMap.style.height = '100%';
            fallbackMap.style.backgroundColor = '#121212';
            fallbackMap.style.display = 'flex';
            fallbackMap.style.flexDirection = 'column';
            fallbackMap.style.alignItems = 'center';
            fallbackMap.style.justifyContent = 'center';
            fallbackMap.style.color = 'white';
            fallbackMap.style.zIndex = '50';
            
            // Add a message
            const message = document.createElement('div');
            message.textContent = 'Map tiles failed to load. Using fallback map.';
            message.style.marginBottom = '10px';
            fallbackMap.appendChild(message);
            
            // Add a static map image from a public API as fallback
            const staticMap = document.createElement('img');
            staticMap.src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=600x400&maptype=roadmap&style=element:labels|visibility:off&style=element:geometry|color:0x242f3e`;
            staticMap.alt = 'Static fallback map';
            staticMap.style.maxWidth = '90%';
            staticMap.style.maxHeight = '70%';
            staticMap.style.border = '1px solid #333';
            staticMap.style.borderRadius = '4px';
            fallbackMap.appendChild(staticMap);
            
            // Add a note about the fallback
            const note = document.createElement('div');
            note.textContent = 'Note: For a better fallback map, consider adding a Google Maps API key';
            note.style.fontSize = '10px';
            note.style.marginTop = '5px';
            note.style.opacity = '0.7';
            fallbackMap.appendChild(note);
            
            // Add a reload button
            const reloadButton = document.createElement('button');
            reloadButton.textContent = 'Try Again';
            reloadButton.style.marginTop = '10px';
            reloadButton.style.padding = '5px 10px';
            reloadButton.style.backgroundColor = '#007bff';
            reloadButton.style.border = 'none';
            reloadButton.style.borderRadius = '3px';
            reloadButton.style.color = 'white';
            reloadButton.style.cursor = 'pointer';
            reloadButton.onclick = () => {
              // Clear any cached data
              localStorage.setItem('mapReloadTimestamp', Date.now().toString());
              window.location.reload();
            };
            fallbackMap.appendChild(reloadButton);
            
            // Add the fallback to the map container
            const mapContainer = document.querySelector('.nws-radar-map');
            if (mapContainer) {
              mapContainer.appendChild(fallbackMap);
            }
          }
        } else if (fallbackMap && loadedCount / mapTiles.length >= 0.5) {
          // If we now have enough tiles loaded, remove the fallback
          if (fallbackMap.parentNode) {
            fallbackMap.parentNode.removeChild(fallbackMap);
          }
          fallbackCreated = false;
        }
      }, 15000); // Check after 15 seconds to give more time for tiles to load
      
      // Do a second check after 30 seconds in case the first check was too early
      const secondCheckTimeout = setTimeout(() => {
        // Only run if we haven't already created a fallback
        if (!fallbackCreated) {
          const mapTiles = document.querySelectorAll('.nws-radar-map img');
          let loadedCount = 0;
          
          mapTiles.forEach(tile => {
            if ((tile as HTMLImageElement).complete && (tile as HTMLImageElement).naturalHeight !== 0) {
              loadedCount++;
            }
          });
          
          console.log(`Second tile loading check: ${loadedCount} of ${mapTiles.length} tiles loaded`);
          
          // If still less than 50% of tiles loaded, show fallback
          if (mapTiles.length > 5 && loadedCount / mapTiles.length < 0.5) {
            console.error('Tile loading still problematic after 30 seconds - showing fallback');
            
            // Create fallback (same code as above)
            fallbackCreated = true;
            
            // Create a fallback static map as a temporary solution
            fallbackMap = document.createElement('div');
            fallbackMap.id = 'radar-fallback-map';
            fallbackMap.style.position = 'absolute';
            fallbackMap.style.top = '0';
            fallbackMap.style.left = '0';
            fallbackMap.style.width = '100%';
            fallbackMap.style.height = '100%';
            fallbackMap.style.backgroundColor = '#121212';
            fallbackMap.style.display = 'flex';
            fallbackMap.style.flexDirection = 'column';
            fallbackMap.style.alignItems = 'center';
            fallbackMap.style.justifyContent = 'center';
            fallbackMap.style.color = 'white';
            fallbackMap.style.zIndex = '50';
            
            // Add a message
            const message = document.createElement('div');
            message.textContent = 'Map tiles failed to load. Using fallback map.';
            message.style.marginBottom = '10px';
            fallbackMap.appendChild(message);
            
            // Add a static map image from a public API as fallback
            const staticMap = document.createElement('img');
            staticMap.src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=600x400&maptype=roadmap&style=element:labels|visibility:off&style=element:geometry|color:0x242f3e`;
            staticMap.alt = 'Static fallback map';
            staticMap.style.maxWidth = '90%';
            staticMap.style.maxHeight = '70%';
            staticMap.style.border = '1px solid #333';
            staticMap.style.borderRadius = '4px';
            fallbackMap.appendChild(staticMap);
            
            // Add a note about the fallback
            const note = document.createElement('div');
            note.textContent = 'Note: For a better fallback map, consider adding a Google Maps API key';
            note.style.fontSize = '10px';
            note.style.marginTop = '5px';
            note.style.opacity = '0.7';
            fallbackMap.appendChild(note);
            
            // Add a reload button
            const reloadButton = document.createElement('button');
            reloadButton.textContent = 'Try Again';
            reloadButton.style.marginTop = '10px';
            reloadButton.style.padding = '5px 10px';
            reloadButton.style.backgroundColor = '#007bff';
            reloadButton.style.border = 'none';
            reloadButton.style.borderRadius = '3px';
            reloadButton.style.color = 'white';
            reloadButton.style.cursor = 'pointer';
            reloadButton.onclick = () => {
              // Clear any cached data
              localStorage.setItem('mapReloadTimestamp', Date.now().toString());
              window.location.reload();
            };
            fallbackMap.appendChild(reloadButton);
            
            // Add the fallback to the map container
            const mapContainer = document.querySelector('.nws-radar-map');
            if (mapContainer) {
              mapContainer.appendChild(fallbackMap);
            }
          }
        }
      }, 30000);
      
      return () => {
        clearTimeout(checkTilesTimeout);
        clearTimeout(secondCheckTimeout);
        if (fallbackMap && fallbackMap.parentNode) {
          fallbackMap.parentNode.removeChild(fallbackMap);
        }
      };
    }
  }, [lat, lon, zoom]);
  
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
      const newFrames = data.frames.reverse();
      setFrames(newFrames);
      
      // Initialize the loadedFrames array with false values
      setLoadedFrames(new Array(newFrames.length).fill(false));
      setCurrentFrame(0);
      
      // Don't set isLoading to false yet - we'll do that when all frames are loaded
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
        
        setAlerts(sortedAlerts);
        setCurrentAlert(0);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      setAlerts([]);
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
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (alertAnimationRef.current) {
        cancelAnimationFrame(alertAnimationRef.current);
      }
    };
  }, [lat, lon, zoom, refreshInterval, frameCount, frameInterval, opacity]);
  
  // Preload all radar frame images
  useEffect(() => {
    if (frames.length === 0) return;
    
    // Create an array to track which frames have been loaded
    const newLoadedFrames = [...loadedFrames];
    let loadedCount = newLoadedFrames.filter(loaded => loaded).length;
    
    // Preload all images
    frames.forEach((frame, index) => {
      if (newLoadedFrames[index]) return; // Skip already loaded frames
      
      const img = new Image();
      img.onload = () => {
        newLoadedFrames[index] = true;
        loadedCount++;
        setLoadedFrames([...newLoadedFrames]);
        
        // If all frames are loaded, set loading to false
        if (loadedCount === frames.length) {
          setIsLoading(false);
          setAllFramesLoaded(true);
        }
      };
      img.onerror = () => {
        console.error(`Failed to load radar frame ${index}`);
        // Mark as loaded anyway to prevent blocking the animation
        newLoadedFrames[index] = true;
        loadedCount++;
        setLoadedFrames([...newLoadedFrames]);
        
        if (loadedCount === frames.length) {
          setIsLoading(false);
          setAllFramesLoaded(true);
        }
      };
      img.src = frame.imageData;
    });
  }, [frames]);
  
  // Animation loop for radar frames - only start when all frames are loaded
  useEffect(() => {
    if (frames.length === 0 || !allFramesLoaded) return;
    
    const animate = () => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
      
      // Use setTimeout instead of requestAnimationFrame for more consistent timing
      animationTimeoutRef.current = setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, 800); // Increased to 800ms for better performance on Raspberry Pi
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [frames, allFramesLoaded]);
  
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
            flexDirection: 'column',
          }}>
            <div>Loading NWS radar data...</div>
            {frames.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                {loadedFrames.filter(Boolean).length} of {frames.length} frames loaded
              </div>
            )}
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
              loadedFrames={loadedFrames}
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
          />
        </div>
      )}
    </>
  );
};

export default NWSRadarMap; 