import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch OpenStreetMap tiles
 * 
 * This endpoint proxies requests to OpenStreetMap's tile server
 * to avoid CORS issues and to add caching
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get parameters from the request
  const zoom = searchParams.get('z');
  const x = searchParams.get('x');
  const y = searchParams.get('y');
  const darkTheme = searchParams.get('darkTheme') === 'true';
  const mode = searchParams.get('mode') || 'single'; // 'single' or 'multiple'
  
  if (!zoom || !x || !y) {
    return NextResponse.json({ error: 'Missing required parameters: z, x, y' }, { status: 400 });
  }
  
  try {
    // For single tile mode (default)
    if (mode === 'single') {
      // Build the URL for OpenStreetMap or CartoDB (dark theme)
      let url;
      
      if (darkTheme) {
        // Use CartoDB dark theme
        url = `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${zoom}/${x}/${y}.png`;
      } else {
        // Use standard OpenStreetMap
        url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
      }
      
      // Fetch the tile
      const response = await fetch(url, {
        headers: {
          // Add a user agent to comply with OSM usage policy
          'User-Agent': 'SmartMirror/1.0 (https://github.com/yourusername/smart-mirror)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tile: ${response.status}`);
      }
      
      // Get the image data
      const imageBuffer = await response.arrayBuffer();
      
      // Return the image with appropriate headers
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
    } 
    // For multiple tiles mode (for better alignment with radar data)
    else if (mode === 'multiple') {
      // This would be implemented to fetch multiple tiles and stitch them together
      // For now, we'll return an error as this is not yet implemented
      return NextResponse.json({ 
        error: 'Multiple tile mode not yet implemented'
      }, { status: 501 });
    }
    else {
      return NextResponse.json({ 
        error: 'Invalid mode parameter. Use "single" or "multiple"'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching OSM tile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch OSM tile', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 