import React, { useEffect } from 'react';
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
const getAltitudeColor = (altitude?: number, invertColors = false): string => {
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

/**
 * Determines if an aircraft is a helicopter based on its type code
 */
const isHelicopter = (aircraftType?: string): boolean => {
  if (!aircraftType) return false;
  
  // Check for helicopter type codes
  return (
    aircraftType.includes('H60') || // Black Hawk
    aircraftType.includes('EC') ||  // Eurocopter models
    aircraftType.includes('R22') || // Robinson R22
    aircraftType.includes('R44') || // Robinson R44
    aircraftType.includes('R66') || // Robinson R66
    aircraftType.includes('B06') || // Bell 206
    aircraftType.includes('B47') || // Bell 47
    aircraftType.includes('S70') || // Sikorsky S-70
    aircraftType.includes('S76') || // Sikorsky S-76
    aircraftType.startsWith('H')    // Generic helicopter indicator
  );
};

// Fighter Jet Icon Component
const FighterJetIcon = ({ rotation, invertColors }: { rotation: string, invertColors: boolean }) => {
  // Use black in day mode (invertColors true), yellow in night mode (invertColors false)
  const filterStyle = invertColors 
    ? 'brightness(0)' // Pure black in day mode
    : 'brightness(0) saturate(100%) invert(83%) sepia(72%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)'; // Gold/yellow in night mode
    
  return (
    <div
      style={{
        position: 'relative',
        width: '24px',
        height: '24px',
        transform: rotation,
      }}
    >
      <Image
        src="/fighter-jet-silhouette.png"
        alt="Fighter jet"
        width={24}
        height={24}
        style={{
          filter: filterStyle,
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
  // Debug: Log the flights we're getting
  useEffect(() => {
    console.log(`FlightOverlay received ${flights.length} flights`);
    
    // Log all aircraft types
    const types = flights.map(f => f.t).filter(Boolean);
    console.log('Aircraft types:', [...new Set(types)]);
    
    // Check for helicopters
    const helicopters = flights.filter(flight => isHelicopter(flight.t));
    if (helicopters.length > 0) {
      console.log(`Found ${helicopters.length} helicopters:`, helicopters.map(h => ({
        type: h.t,
        hex: h.hex,
        lat: h.lat,
        lon: h.lon
      })));
    }
    
    // Check if all flights have position data
    const missingPositionData = flights.filter(f => !f.lat || !f.lon);
    if (missingPositionData.length > 0) {
      console.log(`${missingPositionData.length} flights missing position data`);
    }
  }, [flights]);
  
  // Determine text color based on invertColors
  const textColor = invertColors ? '#000000' : '#ffffff';
  const textShadow = invertColors 
    ? '0 0 3px rgba(255, 255, 255, 0.7)' // White shadow for black text
    : '0 0 3px rgba(0, 0, 0, 0.9)';      // Black shadow for white text
  
  // Count displayed flights for debugging
  let displayedFlights = 0;
  
  const renderedFlights = flights.map((flight) => {
    // Check if flight has position data
    if (!flight.lat || !flight.lon) {
      return null;
    }
    
    const { x, y } = latLonToPixel(flight.lat, flight.lon, tileCoords, zoom, mapWidth, mapHeight);
    
    // Check if flight is within map bounds with some padding
    const padding = 50; // Increased padding to ensure we don't miss edge-case aircraft
    if (x < -padding || x > mapWidth + padding || y < -padding || y > mapHeight + padding) {
      return null;
    }
    
    // Count displayed flights
    displayedFlights++;
    
    const color = getAltitudeColor(flight.alt_baro, invertColors);
    
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
        {/* Fighter jet icon for all aircraft */}
        <div style={{ marginBottom: '4px' }}>
          <FighterJetIcon
            rotation={getRotation(flight.track)}
            invertColors={invertColors}
          />
        </div>
        
        {/* Flight information */}
        <div style={{ color: textColor, fontWeight: 'bold' }}>
          {flight.t || 'Unknown'}
        </div>
        <div style={{ color: textColor }}>
          {flight.alt_baro ? `${Math.round(flight.alt_baro / 100) * 100}ft` : ''}
        </div>
      </div>
    );
  });
  
  // Log displayed flights count after rendering
  useEffect(() => {
    console.log(`Displaying ${displayedFlights}/${flights.length} flights on map`);
  }, [displayedFlights, flights.length]);
  
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
      {renderedFlights}
    </div>
  );
};

export default FlightOverlay; 