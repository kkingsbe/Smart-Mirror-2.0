import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get parameters from the request
  const layer = searchParams.get('layer') || 'PA0'; // Default to accumulated precipitation
  const zoom = searchParams.get('zoom') || '6';
  const x = searchParams.get('x');
  const y = searchParams.get('y');
  const timestamp = searchParams.get('timestamp');
  const highRes = searchParams.get('highRes') === 'true';
  const extremeRes = searchParams.get('extremeRes') === 'true';
  const apiKey = process.env.OPENWEATHERMAP_API_KEY!;
  
  if (!x || !y) {
    return NextResponse.json({ error: 'Missing required parameters: x, y' }, { status: 400 });
  }
  
  try {
    // Build the URL for OpenWeatherMap 2.0 API
    // Format: http://maps.openweathermap.org/maps/2.0/weather/{op}/{z}/{x}/{y}?appid={API key}
    let url = `https://maps.openweathermap.org/maps/2.0/weather/${layer}/${zoom}/${x}/${y}?appid=${apiKey}`;
    
    // Add timestamp if provided (Unix time, UTC)
    if (timestamp) {
      url += `&date=${timestamp}`;
    }
    
    // Add optional parameters for customization
    if (highRes || extremeRes) {
      // Higher opacity for better visibility
      url += `&opacity=0.9`;
      
      // Fill bounds for better coverage
      url += `&fill_bound=true`;
    }
    
    // Log the URL being requested (for debugging)
    console.log(`Fetching radar tile: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    // Fetch the tile from OpenWeatherMap
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`Tile fetch failed with status: ${response.status}`);
      
      // If the request fails, try a different layer as fallback
      if (layer !== 'PA0' && layer !== 'PR0') {
        console.log(`Layer ${layer} failed, falling back to precipitation layer (PA0)`);
        const fallbackUrl = `https://maps.openweathermap.org/maps/2.0/weather/PA0/${zoom}/${x}/${y}?appid=${apiKey}${timestamp ? `&date=${timestamp}` : ''}`;
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to fetch tile: ${fallbackResponse.status}`);
        }
        
        const fallbackImageBuffer = await fallbackResponse.arrayBuffer();
        return new NextResponse(fallbackImageBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          },
        });
      }
      
      throw new Error(`Failed to fetch tile: ${response.status}`);
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Resolution': extremeRes ? 'extreme' : (highRes ? 'high' : 'standard'), // Add resolution info to headers
        'X-Layer': layer, // Add layer info to headers
      },
    });
  } catch (error) {
    console.error('Error fetching radar tile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch radar tile', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 