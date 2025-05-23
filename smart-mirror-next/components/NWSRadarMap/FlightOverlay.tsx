import React, { useEffect } from 'react';
import { TileCoordinates, Flight } from './types';
import Image from 'next/image';
import { calculatePixelCoordinates } from './utils';

interface FlightOverlayProps {
  flights: Flight[];
  tileCoords: TileCoordinates;
  mapWidth: number;
  mapHeight: number;
  zoom: number;
  darkTheme: boolean;
  invertColors: boolean;
}

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
const FighterJetIcon = ({ rotation, invertColors, size }: { rotation: string, invertColors: boolean, size: number }) => {
  // Use black in day mode (invertColors true), yellow in night mode (invertColors false)
  const filterStyle = invertColors 
    ? 'brightness(0)' // Pure black in day mode
    : 'brightness(0) saturate(100%) invert(83%) sepia(72%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)'; // Gold/yellow in night mode
    
  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        transform: rotation,
      }}
    >
      <Image
        src="/fighter-jet-silhouette.png"
        alt="Fighter jet"
        width={size}
        height={size}
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
  
  // Debug logging
  useEffect(() => {
    console.log('Tile coordinates:', tileCoords);
    console.log('Map dimensions:', { mapWidth, mapHeight, zoom });
    
    if (flights.length > 0 && flights[0].lat !== undefined && flights[0].lon !== undefined) {
      // Get a few sample flights for debugging
      const sampleFlights = flights.slice(0, 3).filter(f => f.lat && f.lon);
      
      sampleFlights.forEach(flight => {
        // Calculate position using OSM calculation
        const pos = calculatePixelCoordinates(
          flight.lat!, 
          flight.lon!, 
          tileCoords, 
          zoom, 
          mapWidth, 
          mapHeight
        );
        
        // For comparison, calculate what would be the direct conversion
        const scaleFactor = Math.pow(2, zoom);
        const pointTileX = ((flight.lon! + 180) / 360) * scaleFactor;
        const latRad = flight.lat! * Math.PI / 180;
        const pointTileY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) * scaleFactor / 2;
        
        // Print calculated position and the formula used
        console.log(`Aircraft ${flight.hex}:`, {
          aircraft: flight.t || 'unknown',
          lat: flight.lat,
          lon: flight.lon,
          calculatedPosition: pos,
          formula: {
            tileX: pointTileX,
            tileY: pointTileY,
            formula: "Standard OSM formula"
          }
        });
      });
    }
  }, [tileCoords, mapWidth, mapHeight, zoom, flights]);
  
  // Determine text color based on invertColors
  const textColor = invertColors ? '#000000' : '#ffffff';
  const textShadow = invertColors 
    ? '0 0 3px rgba(255, 255, 255, 0.7)' // White shadow for black text
    : '0 0 3px rgba(0, 0, 0, 0.9)';      // Black shadow for white text
  
  // Count displayed flights for debugging
  let displayedFlights = 0;
  
  const renderedFlights = flights.map((flight) => {
    // Skip flights without lat/lon information
    if (flight.lat === undefined || flight.lon === undefined) return null;

    // Calculate position using the same function used by the map
    const { x, y } = calculatePixelCoordinates(
      flight.lat,
      flight.lon,
      tileCoords,
      zoom,
      mapWidth,
      mapHeight
    );

    // Skip flights outside the visible area with a larger margin
    const padding = 100; // Increase padding to show more aircraft
    if (x < -padding || x > mapWidth + padding || y < -padding || y > mapHeight + padding) return null;
    
    // Count displayed flights
    displayedFlights++;
    
    const color = getAltitudeColor(flight.alt_baro, invertColors);
    const iconSize = 20; // Size of the icon
    
    return (
      <div 
        key={flight.hex}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: color,
          fontSize: '12px',
          textShadow: textShadow,
          zIndex: 21, // Ensure aircraft are above other elements
        }}
      >
        {/* Fighter jet icon - positioned exactly at the aircraft coordinates */}
        <div style={{ 
          position: 'relative', 
          marginBottom: '4px', 
          transform: 'translate(-50%, -50%)' // Center only the icon at the exact coordinates
        }}>
          <FighterJetIcon
            rotation={getRotation(flight.track)}
            invertColors={invertColors}
            size={iconSize}
          />
        </div>
        
        {/* Flight information below the icon */}
        <div style={{ 
          color: textColor, 
          fontWeight: 'bold',
          backgroundColor: invertColors ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          padding: '2px 4px',
          borderRadius: '3px',
          fontSize: '13px',
          transform: 'translateY(-50%)' // Bring text up closer to icon
        }}>
          {flight.t || 'Unknown'}
        </div>
        <div style={{ 
          color: textColor,
          backgroundColor: invertColors ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          padding: '2px 4px',
          borderRadius: '3px',
          marginTop: '2px',
          fontSize: '12px',
          transform: 'translateY(-50%)' // Bring text up closer to icon
        }}>
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