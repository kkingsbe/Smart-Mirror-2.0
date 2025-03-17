import React from 'react';
import { TileCoordinates, Flight } from './types';
import Image from 'next/image';

interface FlightOverlayProps {
  flights: Flight[];
  tileCoords: TileCoordinates;
  mapWidth: number;
  mapHeight: number;
  zoom: number;
  darkTheme?: boolean;
  invertColors?: boolean;
}

/**
 * Converts latitude and longitude to pixel coordinates on the map
 */
const latLonToPixel = (lat: number, lon: number, tileCoords: TileCoordinates, zoom: number, width: number, height: number): { x: number, y: number } => {
  // Tile size is 256x256 pixels
  const tileSize = 256;
  
  // Calculate the global pixel coordinates
  const worldX = ((lon + 180) / 360) * Math.pow(2, zoom + 8);
  const worldY = (0.5 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / (2 * Math.PI)) * Math.pow(2, zoom + 8);
  
  // Calculate the reference pixel (center of map)
  const centerX = tileCoords.xtile * tileSize + tileCoords.xFraction * tileSize;
  const centerY = tileCoords.ytile * tileSize + tileCoords.yFraction * tileSize;
  
  // Calculate the relative pixel position on our canvas
  const x = worldX - centerX + width / 2;
  const y = worldY - centerY + height / 2;
  
  return { x, y };
};

/**
 * Converts the track angle (0-360) to a rotation transform
 */
const getRotation = (track?: number): string => {
  if (track === undefined) return 'rotate(0deg)';
  return `rotate(${track}deg)`;
};

/**
 * Get color based on altitude
 */
const getAltitudeColor = (altitude?: number, darkTheme = true, invertColors = false): string => {
  // If invertColors is true, use black as base color, otherwise use white
  if (altitude === undefined) return invertColors ? '#000000' : '#ffffff';
  
  // Apply different color scheme based on invertColors
  if (invertColors) {
    // Daytime/inverted color scheme (darker colors)
    if (altitude < 1000) return '#006400'; // Dark green for low altitude
    if (altitude < 10000) return '#00008B'; // Dark blue for medium altitude
    if (altitude < 20000) return '#4B0082'; // Indigo for high altitude
    if (altitude < 30000) return '#800080'; // Purple for very high altitude
    return '#8B0000'; // Dark red for extreme altitude
  } else {
    // Nighttime color scheme (brighter colors)
    if (altitude < 1000) return '#42f590'; // Green for low altitude
    if (altitude < 10000) return '#42c9f5'; // Light blue for medium altitude
    if (altitude < 20000) return '#4287f5'; // Blue for high altitude
    if (altitude < 30000) return '#f542f2'; // Magenta for very high altitude
    return '#f54242'; // Red for extreme altitude
  }
};

// Custom component for the Fighter Jet icon that can be colorized
const FighterJetIcon = ({ 
  rotation, 
  invertColors 
}: { 
  rotation: string, 
  invertColors: boolean 
}) => {
  // Use filter transforms to achieve the right coloration
  return (
    <div
      style={{
        position: 'relative',
        width: '24px',
        height: '24px',
        transform: rotation,
        // Apply different filter effects based on day/night mode
        filter: invertColors 
          ? 'brightness(0)' // Pure black silhouette for day mode
          : 'brightness(0) saturate(100%) invert(83%) sepia(72%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)', // Gold for night mode
      }}
    >
      {/* Using next/image for better performance */}
      <Image
        src="/fighter-jet-silhouette.png"
        alt="Fighter jet"
        width={24}
        height={24}
        style={{
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

const FlightOverlay: React.FC<FlightOverlayProps> = ({
  flights,
  tileCoords,
  mapWidth,
  mapHeight,
  zoom,
  darkTheme = true,
  invertColors = false,
}) => {
  // Determine text color based on invertColors
  const textColor = invertColors ? '#000000' : '#ffffff';
  const textShadow = invertColors 
    ? '0 0 3px rgba(255, 255, 255, 0.7)' // White shadow for black text
    : '0 0 3px rgba(0, 0, 0, 0.9)';      // Black shadow for white text
  
  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20 // Above the radar overlay but below alerts
      }}
    >
      {flights.map((flight) => {
        if (!flight.lat || !flight.lon) return null;
        
        const { x, y } = latLonToPixel(flight.lat, flight.lon, tileCoords, zoom, mapWidth, mapHeight);
        
        // Check if flight is within map bounds with some padding
        const padding = 20;
        if (x < -padding || x > mapWidth + padding || y < -padding || y > mapHeight + padding) {
          return null;
        }
        
        const color = getAltitudeColor(flight.alt_baro, darkTheme, invertColors);
        
        return (
          <div 
            key={flight.hex}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `translate(-50%, -50%)`,
              color: color,
              fontSize: '12px',
              textShadow: textShadow,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Fighter Jet icon */}
            <div 
              style={{
                marginBottom: '4px',
              }}
            >
              <FighterJetIcon
                rotation={getRotation(flight.track)}
                invertColors={invertColors}
              />
            </div>
            
            {/* Flight information */}
            <div style={{ color: textColor }}>
              {flight.t || 'Unknown'}
            </div>
            <div style={{ color: textColor }}>
              {flight.alt_baro ? `${Math.round(flight.alt_baro / 100) * 100}ft` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FlightOverlay; 