import { NextResponse } from 'next/server';

// Default radius if not specified
const DEFAULT_RADIUS = 500; // 200nm radius

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
  [key: string]: string | number | boolean | string[] | undefined; // For other properties that might be in the API response
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
    console.log(`Fetching military flights near (${lat}, ${lon}) with radius ${radius}nm`);
    
    // Get military flights
    const militaryResponse = await fetch(
      'https://api.adsb.lol/v2/mil',
      { next: { revalidate: 15 } } // Revalidate every 15 seconds
    );

    if (!militaryResponse.ok) {
      throw new Error(`Failed to fetch military flight data: ${militaryResponse.status}`);
    }

    const militaryData = await militaryResponse.json();
    
    // Log the total number of military flights received
    const totalFlights = militaryData.ac?.length || 0;
    console.log(`Received ${totalFlights} military flights from API`);
    
    if (!militaryData.ac || !Array.isArray(militaryData.ac)) {
      console.warn('No aircraft data found in API response');
      return NextResponse.json({ 
        ac: [], 
        msg: 'No aircraft data found', 
        total: 0,
        now: Date.now() 
      });
    }
    
    // Log all aircraft types for debugging
    const allTypes = militaryData.ac
      .map((a: Aircraft) => a.t)
      .filter(Boolean);
    
    const uniqueTypes = [...new Set(allTypes)];
    console.log(`Unique aircraft types: ${uniqueTypes.join(', ')}`);
    
    // Find aircraft with missing position data
    const noPositionData = militaryData.ac.filter((aircraft: Aircraft) => 
      !aircraft.lat || !aircraft.lon
    );
    
    if (noPositionData.length > 0) {
      console.log(`${noPositionData.length} aircraft missing position data`);
      // Log types of aircraft missing position data
      const typesWithoutPosition = noPositionData
        .map((a: Aircraft) => a.t)
        .filter(Boolean);
      
      if (typesWithoutPosition.length > 0) {
        console.log(`Types missing position: ${[...new Set(typesWithoutPosition)].join(', ')}`);
      }
    }
    
    // Specifically find H60 helicopters
    const h60Helicopters = militaryData.ac.filter((aircraft: Aircraft) => 
      aircraft.t?.includes('H60')
    );
    
    if (h60Helicopters.length > 0) {
      console.log(`Found ${h60Helicopters.length} H60 helicopters:`);
      // Log detailed info about each H60
      h60Helicopters.forEach((h60: Aircraft, index: number) => {
        console.log(`H60 #${index + 1}: hex=${h60.hex}, type=${h60.t}, lat=${h60.lat}, lon=${h60.lon}`);
      });
    }
    
    // Filter military flights to show only those within our radius
    // and add distance property
    const aircraftWithPosition = militaryData.ac.filter((aircraft: Aircraft) => 
      aircraft.lat !== undefined && aircraft.lon !== undefined
    );
    
    console.log(`${aircraftWithPosition.length} of ${totalFlights} aircraft have position data`);
    
    const inRangeAircraft = aircraftWithPosition
      .map((aircraft: Aircraft) => {
        // Calculate distance to our location
        const distance = distanceInNM(
          lat, 
          lon, 
          aircraft.lat!, 
          aircraft.lon!
        );
        
        // Add distance property
        return {
          ...aircraft,
          distance
        };
      })
      .filter((aircraft: Aircraft) => {
        // Handle the case where distance might be undefined
        // This should never happen in practice, but TypeScript doesn't know that
        return typeof aircraft.distance === 'number' && aircraft.distance <= radius;
      });
    
    console.log(`${inRangeAircraft.length} aircraft within ${radius}nm radius`);
    
    // Check for H60 helicopters in the filtered data
    const filteredH60s = inRangeAircraft.filter((aircraft: Aircraft) => 
      aircraft.t?.includes('H60')
    );
    
    if (filteredH60s.length > 0) {
      console.log(`${filteredH60s.length} H60 helicopters within range:`);
      filteredH60s.forEach((h60: Aircraft, index: number) => {
        console.log(`  H60 #${index + 1}: distance=${h60.distance?.toFixed(1)}nm, alt=${h60.alt_baro || 'unknown'}`);
      });
    }
    
    // Sort by distance for better display
    inRangeAircraft.sort((a: Aircraft, b: Aircraft) => 
      ((a.distance as number) || Infinity) - ((b.distance as number) || Infinity)
    );
    
    // Return filtered data
    return NextResponse.json({
      ...militaryData,
      ac: inRangeAircraft,
      total: inRangeAircraft.length,
      now: Date.now(),
      filtered: {
        original: totalFlights,
        withPosition: aircraftWithPosition.length,
        withinRadius: inRangeAircraft.length
      }
    });
  } catch (error) {
    console.error('Error fetching ADSB flight data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flight data' },
      { status: 500 }
    );
  }
} 