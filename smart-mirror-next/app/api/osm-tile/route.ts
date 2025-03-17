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
  const timestamp = searchParams.get('t'); // Cache-busting parameter
  
  // Log request in both development and production
  console.log('OSM tile request:', { 
    zoom, 
    x, 
    y, 
    darkTheme, 
    mode,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
    url: request.url
  });
  
  if (!zoom || !x || !y) {
    console.error('Missing required parameters:', { zoom, x, y });
    return NextResponse.json({ error: 'Missing required parameters: z, x, y' }, { status: 400 });
  }
  
  try {
    // Validate parameters
    const zoomNum = parseInt(zoom, 10);
    const xNum = parseInt(x, 10);
    const yNum = parseInt(y, 10);
    
    if (isNaN(zoomNum) || isNaN(xNum) || isNaN(yNum)) {
      console.error('Invalid parameters (not numbers):', { zoom, x, y });
      return NextResponse.json({ error: 'Invalid parameters: z, x, y must be numbers' }, { status: 400 });
    }
    
    // Ensure zoom is within valid range
    if (zoomNum < 0 || zoomNum > 19) {
      console.error('Invalid zoom level:', zoomNum);
      return NextResponse.json({ error: 'Invalid zoom level: must be between 0 and 19' }, { status: 400 });
    }
    
    // For single tile mode (default)
    if (mode === 'single') {
      // Build the URL for OpenStreetMap or CartoDB (dark theme)
      let url;
      
      // Try multiple tile servers to improve reliability in production
      const servers = darkTheme 
        ? ['a', 'b', 'c', 'd'] // CartoDB has multiple subdomains
        : ['a', 'b', 'c'];     // OSM has multiple subdomains
      
      // Select a server based on the tile coordinates for better distribution
      // or use the timestamp if available for cache busting
      const serverIndex = timestamp 
        ? parseInt(timestamp.slice(-5)) % servers.length
        : (xNum + yNum) % servers.length;
      
      const server = servers[serverIndex];
      
      if (darkTheme) {
        // Use CartoDB dark theme with specific server
        url = `https://cartodb-basemaps-${server}.global.ssl.fastly.net/dark_all/${zoomNum}/${xNum}/${yNum}.png`;
      } else {
        // Use standard OpenStreetMap with specific server
        url = `https://${server}.tile.openstreetmap.org/${zoomNum}/${xNum}/${yNum}.png`;
      }
      
      // Log the URL
      console.log('Fetching OSM tile from:', { url, server, serverIndex });
      
      // Fetch the tile with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(url, {
          headers: {
            // Add a user agent to comply with OSM usage policy
            'User-Agent': 'SmartMirror/1.0 (https://github.com/yourusername/smart-mirror)',
            // Add cache control headers
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal,
          // Disable cache in production to troubleshoot
          cache: process.env.NODE_ENV === 'production' ? 'no-store' : 'default'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`Failed to fetch tile: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch tile: ${response.status}`);
        }
        
        // Get the image data
        const imageBuffer = await response.arrayBuffer();
        
        // Check if we actually got an image
        if (imageBuffer.byteLength < 100) {
          console.error(`Received suspiciously small tile (${imageBuffer.byteLength} bytes)`);
          throw new Error('Invalid tile data (too small)');
        }
        
        // Return the image with appropriate headers
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': process.env.NODE_ENV === 'production' 
              ? 'no-cache, no-store, must-revalidate' // Disable caching in production for debugging
              : 'public, max-age=86400', // Cache for 24 hours in development
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        
        // If it's a timeout, provide a specific error
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('Tile fetch timeout:', url);
          return NextResponse.json({ error: 'Tile fetch timeout' }, { status: 504 });
        }
        
        console.error('Fetch error:', fetchError);
        throw fetchError; // Re-throw for the outer catch block
      }
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