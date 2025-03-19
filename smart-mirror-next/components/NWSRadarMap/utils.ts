import { AlertColor, TileCoordinates, WeatherAlert } from './types';

// Keep track of logged tile coordinates to prevent excessive logging
const loggedTiles = new Set<string>();

/**
 * Calculate tile coordinates from lat/lon for the base map
 * Using the standard OSM Web Mercator projection formula
 */
export const calculateTileCoordinates = (lat: number, lon: number, zoom: number): TileCoordinates => {
  // Use the exact same mercator projection as the pixel calculation
  const latLimitDegrees = 85.0511287798;
  const validLat = Math.max(Math.min(latLimitDegrees, lat), -latLimitDegrees);
  const validLon = lon;
  
  // First, project to Mercator coordinates (in [0,1] space at zoom 0)
  const latRad = validLat * Math.PI / 180;
  const mercatorX = (validLon + 180) / 360;
  const mercatorY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
  
  // Convert to tile coordinates at the specified zoom level
  const scale = Math.pow(2, zoom);
  const xtile = mercatorX * scale;
  const ytile = mercatorY * scale;
  
  // Get the integer part of the tile coordinates (floor for proper tile addressing)
  const x = Math.floor(xtile);
  const y = Math.floor(ytile);
  
  // Calculate the precise position within the tile (0 to 1)
  const xFraction = xtile - x;
  const yFraction = ytile - y;
  
  // Log coordinates only once to prevent excessive logging
  const logKey = `tile_${lat.toFixed(4)},${lon.toFixed(4)},${zoom}`;
  if (!loggedTiles.has(logKey)) {
    console.log('Tile coordinates calculation:', { 
      input: { lat, lon, zoom }, 
      mercator: { x: mercatorX, y: mercatorY },
      tileCoords: { xtile, ytile },
      result: { x, y, xFraction, yFraction }
    });
    loggedTiles.add(logKey);
  }
  
  return { x, y, xFraction, yFraction, xtile, ytile };
};

/**
 * Get tile URL for the base map
 */
export const getTileUrl = (
  x: number, 
  y: number, 
  zoom: number, 
  darkTheme: boolean, 
  contrast: number = 1.2,
  invertColors: boolean = true
): string => {
  // Ensure zoom is valid
  const validZoom = Math.max(0, Math.min(19, zoom));
  
  // Ensure y is within valid range (0 to 2^zoom - 1)
  const maxTile = Math.pow(2, validZoom) - 1;
  const validY = Math.max(0, Math.min(Math.floor(y), maxTile));
  
  // Handle x wrapping around the world
  // The previous normalization was potentially causing discrepancies with coordinate calculations
  // Using the standard OSM approach for x coordination wrapping
  const validX = Math.floor(x) % Math.pow(2, validZoom);
  
  // Add a unique identifier for each environment to prevent cross-environment caching
  const envMarker = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  
  // Log tile URL parameters only once per tile to prevent excessive logging
  const logKey = `${validX},${validY},${validZoom},${darkTheme},${contrast},${invertColors}`;
  if (!loggedTiles.has(logKey)) {
    console.log('getTileUrl:', { 
      input: { x, y, zoom, darkTheme, contrast, invertColors }, 
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
  
  return `/api/osm-tile?z=${validZoom}&x=${validX}&y=${validY}&darkTheme=${darkTheme}&env=${envMarker}&contrast=${contrast}&invert=${invertColors}`;
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

/**
 * Calculates pixel coordinates for a lat,lon point using the official OSM method
 * 
 * This function exactly mirrors how OpenLayers/Leaflet would calculate positions
 */
export const calculatePixelCoordinates = (lat: number, lon: number, tileCoords: TileCoordinates, zoom: number, width: number, height: number): { x: number, y: number } => {
  // Constants
  const TILE_SIZE = 256;
  
  // Mercator math is very sensitive to precision - use full precision
  // Convert latlng to absolute pixel coordinates in the global pixel space
  
  // First, project to Mercator coordinates (in [0,1] space at zoom 0)
  const latLimitDegrees = 85.0511287798;
  const validLat = Math.max(Math.min(latLimitDegrees, lat), -latLimitDegrees);
  const validLon = lon;
  
  const latRad = validLat * Math.PI / 180;
  const mercatorX = (validLon + 180) / 360;
  const mercatorY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
  
  // Convert to the global pixel coordinates at current zoom
  const scale = Math.pow(2, zoom);
  const worldPixelX = mercatorX * scale * TILE_SIZE;
  const worldPixelY = mercatorY * scale * TILE_SIZE;
  
  // Get the pixel coordinates of the center of the map
  // Using xtile and ytile directly for precise calculations
  const centerPixelX = tileCoords.xtile * TILE_SIZE;
  const centerPixelY = tileCoords.ytile * TILE_SIZE;
  
  // Calculate the viewport pixel coordinates relative to the center
  // Add width/2 and height/2 to center the offset in the viewport
  const viewportX = Math.round(worldPixelX - centerPixelX + width / 2);
  const viewportY = Math.round(worldPixelY - centerPixelY + height / 2);
  
  // Debug logging to understand the calculations
  const logKey = `osm_${lat.toFixed(4)},${lon.toFixed(4)},${zoom}`;
  if (!loggedTiles.has(logKey)) {
    console.log('OSM Pixel calculation:', {
      input: { lat, lon, zoom, width, height },
      mercator: { x: mercatorX, y: mercatorY },
      worldPixel: { x: worldPixelX, y: worldPixelY },
      centerPixel: { x: centerPixelX, y: centerPixelY },
      viewport: { x: viewportX, y: viewportY },
      offset: { 
        x: worldPixelX - centerPixelX,
        y: worldPixelY - centerPixelY
      },
      tileCoords
    });
    loggedTiles.add(logKey);
  }
  
  return { x: viewportX, y: viewportY };
}; 