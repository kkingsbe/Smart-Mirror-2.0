import { NextRequest, NextResponse } from 'next/server';

// Keep track of logged requests to prevent excessive logging
const loggedRequests = new Set<string>();

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
  const env = searchParams.get('env'); // Environment marker
  const timestamp = searchParams.get('t'); // Cache-busting parameter
  
  // Get user agent for debugging
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const isRaspberryPi = userAgent.toLowerCase().includes('raspbian') || 
                        userAgent.toLowerCase().includes('raspberry') ||
                        userAgent.toLowerCase().includes('armv7') ||
                        userAgent.toLowerCase().includes('linux armv');
  
  // Create a unique key for this request for logging purposes
  const requestKey = `${zoom},${x},${y},${darkTheme},${env}`;
  
  // Log request only once per unique tile to prevent excessive logging
  if (!loggedRequests.has(requestKey)) {
    console.log('OSM tile request:', { 
      zoom, 
      x, 
      y, 
      darkTheme, 
      mode,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
      isRaspberryPi,
      userAgent: userAgent.substring(0, 100) // Log only first 100 chars of UA
    });
    
    loggedRequests.add(requestKey);
    
    // Limit the size of the set to prevent memory leaks
    if (loggedRequests.size > 1000) {
      // Clear the oldest entries (first 500)
      const entries = Array.from(loggedRequests);
      for (let i = 0; i < 500; i++) {
        loggedRequests.delete(entries[i]);
      }
    }
  }
  
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
      // Use a deterministic approach based on the tile coordinates
      const serverIndex = ((xNum * 31) + yNum) % servers.length;
      const server = servers[serverIndex];
      
      // Add a timestamp to the URL to prevent caching issues on Raspberry Pi
      const cacheBuster = isRaspberryPi ? `?_t=${Date.now()}` : '';
      
      if (darkTheme) {
        // Use CartoDB dark theme with specific server
        url = `https://cartodb-basemaps-${server}.global.ssl.fastly.net/dark_all/${zoomNum}/${xNum}/${yNum}.png${cacheBuster}`;
      } else {
        // Use standard OpenStreetMap with specific server
        url = `https://${server}.tile.openstreetmap.org/${zoomNum}/${xNum}/${yNum}.png${cacheBuster}`;
      }
      
      // Only log new URLs to prevent excessive logging
      if (!loggedRequests.has(`url:${url}`)) {
        console.log('Fetching OSM tile from:', { url, server, serverIndex, isRaspberryPi });
        loggedRequests.add(`url:${url}`);
      }
      
      // Fetch the tile with timeout - longer timeout for Raspberry Pi
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isRaspberryPi ? 10000 : 5000); // 10 second timeout for Raspberry Pi
      
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
          // Disable caching completely
          cache: 'no-store',
          next: { revalidate: 0 }
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
            // Disable caching completely
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store',
            // Add Access-Control-Allow headers for Raspberry Pi
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
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