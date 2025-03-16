import { NextRequest, NextResponse } from 'next/server';

type WeatherMapParams = {
  layer: string;
  zoom: number;
  lat: number;
  lon: number;
  frames?: number;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const layer = searchParams.get('layer') || 'PR0';
  const zoom = parseInt(searchParams.get('zoom') || '6');
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lon = parseFloat(searchParams.get('lon') || '0');
  const frames = parseInt(searchParams.get('frames') || '10');
  
  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Latitude and longitude must be valid numbers' }, { status: 400 });
  }

  if (!process.env.OPENWEATHERMAP_API_KEY) {
    console.error('OPENWEATHERMAP_API_KEY is not defined in environment variables');
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
  }

  try {
    // Convert lat/lon to tile coordinates
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    console.log(`Tile coordinates for lat=${lat}, lon=${lon}, zoom=${zoom}: x=${x}, y=${y}`);
    
    // Get current time and calculate frame times (last N hours)
    const now = Math.floor(Date.now() / 1000);
    const frameUrls = [];
    
    // Generate URLs for each frame (one per hour going back)
    for (let i = 0; i < frames; i++) {
      const timestamp = now - (i * 3600); // Go back i hours
      const url = `https://maps.openweathermap.org/maps/2.0/weather/1h/${layer}/${zoom}/${x}/${y}?appid=${process.env.OPENWEATHERMAP_API_KEY}&date=${timestamp}`;
      frameUrls.push(url);
    }
    
    // Validate that we have URLs
    if (frameUrls.length === 0) {
      return NextResponse.json({ error: 'Failed to generate frame URLs' }, { status: 500 });
    }
    
    return NextResponse.json({ frameUrls: frameUrls.reverse() }); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching weather map:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch weather map data', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 