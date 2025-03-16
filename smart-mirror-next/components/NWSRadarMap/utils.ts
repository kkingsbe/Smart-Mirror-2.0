import { AlertColor, TileCoordinates, WeatherAlert } from './types';

/**
 * Calculate tile coordinates from lat/lon for the base map
 */
export const calculateTileCoordinates = (lat: number, lon: number, zoom: number): TileCoordinates => {
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

/**
 * Get tile URL for the base map
 */
export const getTileUrl = (x: number, y: number, zoom: number, darkTheme: boolean): string => {
  // Ensure y is within valid range (0 to 2^zoom - 1)
  const maxTile = Math.pow(2, zoom) - 1;
  const validY = Math.max(0, Math.min(y, maxTile));
  
  // Handle x wrapping around the world
  const validX = ((x % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);
  
  return `/api/osm-tile?z=${zoom}&x=${validX}&y=${validY}&darkTheme=${darkTheme}`;
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