import { NextResponse } from 'next/server';

// Default radius if not specified
const DEFAULT_RADIUS = 200; // 200nm radius

// Aircraft interface
interface Aircraft {
  hex: string;
  flight?: string;
  alt_baro?: number;
  gs?: number;
  track?: number;
  lat?: number;
  lon?: number;
  r?: string;
  t?: string;
  type?: string;
  distance?: number;
  [key: string]: any; // For other properties that might be in the API response
}

/**
 * Calculates the distance between two points in nautical miles using the Haversine formula
 */
const distanceInNM = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export async function GET(request: Request) {
  // Get coordinates from query parameters
  const url = new URL(request.url);
  const lat = parseFloat(url.searchParams.get('lat') || '0');
  const lon = parseFloat(url.searchParams.get('lon') || '0');
  const radius = parseFloat(url.searchParams.get('radius') || String(DEFAULT_RADIUS));
  
  // Validate coordinates
  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    );
  }

  try {
    // Get military flights
    const militaryResponse = await fetch(
      'https://api.adsb.lol/v2/mil',
      { next: { revalidate: 15 } } // Revalidate every 15 seconds
    );

    if (!militaryResponse.ok) {
      throw new Error(`Failed to fetch military flight data: ${militaryResponse.status}`);
    }

    const militaryData = await militaryResponse.json();
    
    // Filter military flights to show only those within our radius
    // and add distance property
    if (militaryData.ac && Array.isArray(militaryData.ac)) {
      militaryData.ac = militaryData.ac
        .filter((aircraft: Aircraft) => {
          // Skip aircraft without position data
          if (!aircraft.lat || !aircraft.lon) return false;
          
          // Calculate distance to our location
          const distance = distanceInNM(
            lat, 
            lon, 
            aircraft.lat, 
            aircraft.lon
          );
          
          // Only include aircraft within our radius
          return distance <= radius;
        })
        .map((aircraft: Aircraft) => {
          // Add distance property
          if (aircraft.lat && aircraft.lon) {
            aircraft.distance = distanceInNM(
              lat, 
              lon, 
              aircraft.lat, 
              aircraft.lon
            );
          }
          return aircraft;
        });
    }
    
    return NextResponse.json(militaryData);
  } catch (error) {
    console.error('Error fetching ADSB flight data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flight data' },
      { status: 500 }
    );
  }
} 