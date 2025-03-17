export interface NWSRadarMapProps {
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
  contrast?: number; // Contrast enhancement for map tiles (default: 1.2)
  invertColors?: boolean; // Whether to invert the colors of the map tiles (default: true)
}

export interface RadarFrame {
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

export interface WeatherAlert {
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
export interface AlertCounts {
  [key: string]: number;
}

export interface TileCoordinates {
  x: number;
  y: number;
  xFraction: number;
  yFraction: number;
  xtile: number;
  ytile: number;
}

export interface AlertColor {
  bg: string;
  text: string;
} 