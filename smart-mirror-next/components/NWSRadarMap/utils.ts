import { AlertColor, TileCoordinates, WeatherAlert } from './types';

// Keep track of logged tile coordinates to prevent excessive logging
const loggedTiles = new Set<string>();

/**
 * Calculate tile coordinates from lat/lon for the base map
 */
export const calculateTileCoordinates = (lat: number, lon: number, zoom: number): TileCoordinates => {
  // Ensure lat and lon are valid numbers
  const validLat = Number.isFinite(lat) ? Math.max(-85.05112878, Math.min(85.05112878, lat)) : 0;
  const validLon = Number.isFinite(lon) ? ((lon + 540) % 360) - 180 : 0;
  
  // Convert lat/lon to tile coordinates at the specified zoom level
  const n = Math.pow(2, zoom);
  const xtile = ((validLon + 180) / 360) * n;
  const ytile = (1 - Math.log(Math.tan(validLat * Math.PI / 180) + 1 / Math.cos(validLat * Math.PI / 180)) / Math.PI) / 2 * n;
  
  // Get the integer part of the tile coordinates
  const x = Math.floor(xtile);
  const y = Math.floor(ytile);
  
  // Calculate the precise position within the tile (0 to 1)
  const xFraction = xtile - x;
  const yFraction = ytile - y;
  
  // Log coordinates only once to prevent excessive logging
  const logKey = `${lat.toFixed(4)},${lon.toFixed(4)},${zoom}`;
  if (!loggedTiles.has(logKey)) {
    console.log('Tile coordinates calculation:', { 
      input: { lat, lon, zoom }, 
      valid: { validLat, validLon },
      calculated: { xtile, ytile, x, y, xFraction, yFraction },
      environment: process.env.NODE_ENV
    });
    loggedTiles.add(logKey);
  }
  
  return { x, y, xFraction, yFraction, xtile, ytile };
};

/**
 * Get tile URL for the base map
 */
export const getTileUrl = (x: number, y: number, zoom: number, darkTheme: boolean): string => {
  // Ensure zoom is valid
  const validZoom = Math.max(0, Math.min(19, zoom));
  
  // Ensure y is within valid range (0 to 2^zoom - 1)
  const maxTile = Math.pow(2, validZoom) - 1;
  const validY = Math.max(0, Math.min(Math.floor(y), maxTile));
  
  // Handle x wrapping around the world
  const validX = Math.floor(((x % Math.pow(2, validZoom)) + Math.pow(2, validZoom)) % Math.pow(2, validZoom));
  
  // Add a unique identifier for each environment to prevent cross-environment caching
  const envMarker = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  
  // Log tile URL parameters only once per tile to prevent excessive logging
  const logKey = `${validX},${validY},${validZoom},${darkTheme}`;
  if (!loggedTiles.has(logKey)) {
    console.log('getTileUrl:', { 
      input: { x, y, zoom, darkTheme }, 
      valid: { validX, validY, validZoom },
      environment: process.env.NODE_ENV
    });
    loggedTiles.add(logKey);
    
    // Limit the size of the set to prevent memory leaks
    if (loggedTiles.size > 1000) {
      // Clear the oldest entries (first 500)
      const entries = Array.from(loggedTiles);
      for (let i = 0; i < 500; i++) {
        loggedTiles.delete(entries[i]);
      }
    }
  }
  
  return `/api/osm-tile?z=${validZoom}&x=${validX}&y=${validY}&darkTheme=${darkTheme}&env=${envMarker}`;
};

/**
 * Get alert color based on severity
 */
export const getAlertColor = (severity: string): AlertColor => {
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

/**
 * Sort alerts by severity (most severe first)
 */
export const sortAlertsBySeverity = (alerts: WeatherAlert[]): WeatherAlert[] => {
  return [...alerts].sort((a, b) => {
    const severityOrder: Record<string, number> = {
      'Extreme': 0,
      'Severe': 1,
      'Moderate': 2,
      'Minor': 3,
      'Unknown': 4
    };
    
    return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
  });
}; 