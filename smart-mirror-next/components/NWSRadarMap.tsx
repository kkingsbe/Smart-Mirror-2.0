import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Wind, 
  CloudLightning, 
  Snowflake, 
  Droplets, 
  AlertCircle, 
  ThermometerSnowflake, 
  Sun, 
  Info
} from 'lucide-react';

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
  showLocationMarker?: boolean; // Whether to show a marker at the specified location
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

interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  effective: string;
  expires: string;
  areaDesc: string;
}

// Group alerts by type for counting
interface AlertCounts {
  [key: string]: number;
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
  showLocationMarker = true, // Default to showing the location marker
}) => {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<number>(0);
  const [alertCounts, setAlertCounts] = useState<AlertCounts>({});
  const [textScrollPosition, setTextScrollPosition] = useState<number>(0);
  const animationRef = useRef<number | null>(null);
  const alertAnimationRef = useRef<number | null>(null);
  const textScrollRef = useRef<number | null>(null);
  const alertTextRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Calculate tile coordinates from lat/lon for the base map
  const calculateTileCoordinates = () => {
    // Convert lat/lon to tile coordinates at the specified zoom level
    const n = Math.pow(2, zoom);
    const xtile = ((lon + 180) / 360) * n;
    const ytile = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n;
    
    // Get the integer part of the tile coordinates
    const x = Math.floor(xtile);
    const y = Math.floor(ytile);
    
    // Calculate the precise position within the tile (0 to 1)
    const xFraction = xtile - x;
    const yFraction = ytile - y;
    
    return { x, y, xFraction, yFraction, xtile, ytile };
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
        const sortedAlerts = data.alerts.sort((a: WeatherAlert, b: WeatherAlert) => {
          const severityOrder: Record<string, number> = {
            'Extreme': 0,
            'Severe': 1,
            'Moderate': 2,
            'Minor': 3,
            'Unknown': 4
          };
          
          return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
        });
        
        // Count alerts by type
        const counts: AlertCounts = {};
        sortedAlerts.forEach((alert: WeatherAlert) => {
          const eventType = alert.event;
          counts[eventType] = (counts[eventType] || 0) + 1;
        });
        
        setAlertCounts(counts);
        setAlerts(sortedAlerts);
        setCurrentAlert(0);
        setTextScrollPosition(0); // Reset text scroll position for new alerts
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
      if (textScrollRef.current !== null) {
        clearInterval(textScrollRef.current);
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
        setTextScrollPosition(0); // Reset text scroll position when changing alerts
      }, 8000);
      
      return () => clearInterval(intervalId);
    };
    
    const cleanup = animateAlerts();
    
    return () => {
      cleanup();
    };
  }, [alerts]);
  
  // Text scrolling effect for alert text
  useEffect(() => {
    if (alerts.length === 0 || !alertTextRef.current) return;
    
    // Clear any existing interval
    if (textScrollRef.current !== null) {
      clearInterval(textScrollRef.current);
    }
    
    const textElement = alertTextRef.current;
    // Reset scroll position to the beginning
    textElement.scrollLeft = 0;
    
    const textWidth = textElement.scrollWidth;
    const containerWidth = textElement.clientWidth;
    
    // Only scroll if text is overflowing
    if (textWidth > containerWidth) {
      // Start scrolling after a delay
      setTimeout(() => {
        // Scroll the text from left to right
        let scrollPosition = 0;
        
        textScrollRef.current = window.setInterval(() => {
          // Increment scroll position
          scrollPosition += 1;
          
          // If we've reached the end, reset to beginning with a pause
          if (scrollPosition >= textWidth - containerWidth) {
            // Pause at the end
            clearInterval(textScrollRef.current!);
            setTimeout(() => {
              // Reset to beginning
              scrollPosition = 0;
              textElement.scrollLeft = scrollPosition;
              
              // Start scrolling again after a pause
              setTimeout(() => {
                textScrollRef.current = window.setInterval(() => {
                  scrollPosition += 1;
                  textElement.scrollLeft = scrollPosition;
                  
                  // Loop when reaching the end again
                  if (scrollPosition >= textWidth - containerWidth) {
                    clearInterval(textScrollRef.current!);
                    setTimeout(() => {
                      scrollPosition = 0;
                      textElement.scrollLeft = scrollPosition;
                      
                      // Restart the interval
                      textScrollRef.current = window.setInterval(() => {
                        scrollPosition += 1;
                        textElement.scrollLeft = scrollPosition;
                        
                        if (scrollPosition >= textWidth - containerWidth) {
                          // Continue the pattern for smooth looping
                          clearInterval(textScrollRef.current!);
                          setTimeout(() => {
                            scrollPosition = 0;
                            textElement.scrollLeft = scrollPosition;
                          }, 1000);
                        }
                      }, 30);
                    }, 1000);
                  }
                }, 30);
              }, 1000);
            }, 1000);
          } else {
            textElement.scrollLeft = scrollPosition;
          }
        }, 30);
      }, 2000); // Wait 2 seconds before starting to scroll
    }
    
    return () => {
      if (textScrollRef.current !== null) {
        clearInterval(textScrollRef.current);
      }
    };
  }, [currentAlert, alerts]);
  
  // Get alert color based on severity
  const getAlertColor = (severity: string): { bg: string, text: string } => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return { bg: 'rgba(255, 0, 0, 0.9)', text: 'white' };
      case 'severe':
        return { bg: 'rgba(255, 165, 0, 0.9)', text: 'black' };
      case 'moderate':
        return { bg: 'rgba(255, 255, 0, 0.9)', text: 'black' };
      case 'minor':
        return { bg: 'rgba(0, 255, 255, 0.9)', text: 'black' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.9)', text: 'black' };
    }
  };
  
  // Get icon for alert type
  const getAlertIcon = (eventType: string) => {
    const iconProps = { size: 16, strokeWidth: 2 };
    
    if (eventType.includes('Tornado')) {
      return <Wind {...iconProps} />;
    } else if (eventType.includes('Thunderstorm') || eventType.includes('Lightning')) {
      return <CloudLightning {...iconProps} />;
    } else if (eventType.includes('Snow') || eventType.includes('Blizzard') || eventType.includes('Winter')) {
      return <Snowflake {...iconProps} />;
    } else if (eventType.includes('Flood') || eventType.includes('Rain')) {
      return <Droplets {...iconProps} />;
    } else if (eventType.includes('Wind')) {
      return <Wind {...iconProps} />;
    } else if (eventType.includes('Freeze') || eventType.includes('Frost') || eventType.includes('Cold')) {
      return <ThermometerSnowflake {...iconProps} />;
    } else if (eventType.includes('Heat') || eventType.includes('Hot')) {
      return <Sun {...iconProps} />;
    } else if (eventType.includes('Warning')) {
      return <AlertTriangle {...iconProps} />;
    } else if (eventType.includes('Watch')) {
      return <AlertCircle {...iconProps} />;
    } else {
      return <Info {...iconProps} />;
    }
  };
  
  // Get tile coordinates for the base map
  const tileCoords = calculateTileCoordinates();
  
  // Calculate the offset to center the map on the exact coordinates
  // 256 is the standard tile size in pixels
  const tileSize = 256;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate the position of the center tile
  const centerTileX = tileCoords.xtile * tileSize;
  const centerTileY = tileCoords.ytile * tileSize;
  
  // Calculate the offset needed to center the exact coordinates
  const xOffset = centerX - centerTileX;
  const yOffset = centerY - centerTileY;
  
  // Determine which tiles we need to display
  const getTileUrl = (x: number, y: number) => {
    // Ensure y is within valid range (0 to 2^zoom - 1)
    const maxTile = Math.pow(2, zoom) - 1;
    const validY = Math.max(0, Math.min(y, maxTile));
    
    // Handle x wrapping around the world
    const validX = ((x % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);
    
    return `/api/osm-tile?z=${zoom}&x=${validX}&y=${validY}&darkTheme=${darkTheme}`;
  };
  
  // Calculate the range of tiles needed to cover the viewport
  const tilesNeeded = Math.ceil(Math.max(width, height) / tileSize) + 1;
  const halfTiles = Math.floor(tilesNeeded / 2);
  
  // Generate array of tile offsets needed
  const tileOffsets = Array.from({ length: tilesNeeded }, (_, i) => i - halfTiles);
  
  // Location marker styles
  const markerSize = 20; // Size of the marker in pixels
  const pulseSize = 40; // Size of the pulse effect
  
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
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: `translate(${xOffset}px, ${yOffset}px)`,
              }}
            >
              {/* Grid of tiles to cover the viewport */}
              {tileOffsets.map((yOffset) => (
                tileOffsets.map((xOffset) => {
                  const tileX = Math.floor(tileCoords.xtile) + xOffset;
                  const tileY = Math.floor(tileCoords.ytile) + yOffset;
                  return (
                    <img 
                      key={`${tileX}-${tileY}`}
                      src={getTileUrl(tileX, tileY)}
                      alt={`Map tile ${tileX},${tileY}`}
                      style={{
                        position: 'absolute',
                        left: `${tileX * tileSize}px`,
                        top: `${tileY * tileSize}px`,
                        width: `${tileSize}px`,
                        height: `${tileSize}px`,
                        filter: darkTheme ? 'brightness(0.8) contrast(1.2)' : 'none', // Enhance dark theme
                      }}
                    />
                  );
                })
              ))}
            </div>
          </div>
          
          {/* Radar frames */}
          {frames.map((frame, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: index === currentFrame ? opacity : 0,
                transition: 'opacity 0.2s ease-in-out',
                overflow: 'hidden',
                zIndex: 5,
              }}
            >
              <img
                src={frame.imageData}
                alt={`Weather radar frame ${index + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  mixBlendMode: darkTheme ? 'screen' : 'normal', // Improve visibility on dark backgrounds
                }}
              />
            </div>
          ))}
          
          {/* Weather Alerts Display */}
          {alerts.length > 0 && currentAlert < alerts.length && (
            <div 
              style={{
                position: 'absolute',
                top: 5,
                left: 5,
                maxWidth: '70%',
                color: getAlertColor(alerts[currentAlert].severity).text,
                background: getAlertColor(alerts[currentAlert].severity).bg,
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 100,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Alert header with icon, title and counter */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px',
                width: '100%',
                justifyContent: 'space-between',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <div style={{ 
                    marginRight: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {getAlertIcon(alerts[currentAlert].event)}
                  </div>
                  <div style={{ 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                  }}>
                    {alerts[currentAlert].event}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  marginLeft: '8px',
                  flexShrink: 0,
                }}>
                  {currentAlert + 1}/{alerts.length}
                </div>
              </div>
              
              {/* Alert description */}
              <div 
                ref={alertTextRef}
                style={{ 
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  scrollBehavior: 'smooth',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingTop: '4px',
                }}
              >
                {alerts[currentAlert].headline || alerts[currentAlert].description.substring(0, 100)}
              </div>
            </div>
          )}
          
          {/* Location marker - always in the center of the container */}
          {showLocationMarker && (
            <>
              {/* Pulsing circle effect */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${pulseSize}px`,
                  height: `${pulseSize}px`,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 120, 255, 0.3)',
                  transform: 'translate(-50%, -50%)',
                  animation: 'pulse 2s infinite',
                  zIndex: 10,
                }}
              />
              
              {/* Marker dot */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${markerSize}px`,
                  height: `${markerSize}px`,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 120, 255, 0.8)',
                  border: '2px solid white',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 11,
                  boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
                }}
              />
              
              {/* Add CSS animation for the pulse effect */}
              <style jsx>{`
                @keyframes pulse {
                  0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 0.8;
                  }
                  70% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0;
                  }
                  100% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 0;
                  }
                }
              `}</style>
            </>
          )}
          
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
              zIndex: 100
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
            zIndex: 100
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
            zIndex: 100
          }}>
            {frameInterval}min intervals
          </div>
        </>
      )}
    </div>
  );
};

export default NWSRadarMap; 