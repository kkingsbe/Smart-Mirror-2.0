import { NextRequest, NextResponse } from 'next/server';

// Completely disable caching for this route
export const dynamic = 'force-dynamic';

/**
 * API route to fetch NWS radar data
 * 
 * The NWS API provides radar data in GeoJSON format
 * This endpoint fetches the data and returns it to the client
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get parameters from the request
  const frameCount = parseInt(searchParams.get('frameCount') || '6');
  const interval = parseInt(searchParams.get('interval') || '15'); // minutes
  const lat = parseFloat(searchParams.get('lat') || '39.8283'); // Default to center of US
  const lon = parseFloat(searchParams.get('lon') || '-98.5795');
  const zoom = parseInt(searchParams.get('zoom') || '7');
  const opacity = parseFloat(searchParams.get('opacity') || '1.0'); // Default to full opacity
  
  try {
    // Calculate timestamps for the frames (15 minute intervals)
    const now = new Date();
    const timestamps = [];
    
    // Generate timestamps for each frame, going backward in time
    for (let i = 0; i < frameCount; i++) {
      const frameTime = new Date(now.getTime() - (i * interval * 60 * 1000));
      
      // Format timestamp to nearest 15 minute interval
      frameTime.setMinutes(Math.floor(frameTime.getMinutes() / 15) * 15);
      frameTime.setSeconds(0);
      frameTime.setMilliseconds(0);
      
      timestamps.push(frameTime);
    }
    
    // Calculate the bounding box based on lat/lon and zoom level
    // This ensures the radar data aligns with the OSM tiles
    const getBoundingBox = (lat: number, lon: number, zoom: number) => {
      // Calculate the width of the viewport in degrees
      // At zoom level 0, the entire world is 360 degrees wide
      // Each zoom level doubles the resolution
      const worldWidth = 360;
      const zoomFactor = Math.pow(2, zoom);
      const viewportWidth = worldWidth / zoomFactor;
      
      // Calculate the height of the viewport based on the Mercator projection
      // This accounts for the distortion at different latitudes
      const viewportHeight = viewportWidth * (3/4); // Assuming a 4:3 aspect ratio
      
      // Calculate the bounding box
      const west = lon - viewportWidth / 2;
      const east = lon + viewportWidth / 2;
      const north = lat + viewportHeight / 2;
      const south = lat - viewportHeight / 2;
      
      return { north, south, east, west };
    };
    
    // Get the bounding box for the current view
    const bbox = getBoundingBox(lat, lon, zoom);
    
    // Convert the bounding box to EPSG:3857 (Web Mercator) coordinates
    // This is the projection used by OpenStreetMap
    const lonToX = (lon: number) => {
      return lon * 20037508.34 / 180;
    };
    
    const latToY = (lat: number) => {
      const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
      return y * 20037508.34 / 180;
    };
    
    // Calculate the bounding box in EPSG:3857 coordinates
    const bboxMercator = {
      west: lonToX(bbox.west),
      east: lonToX(bbox.east),
      north: latToY(bbox.north),
      south: latToY(bbox.south)
    };
    
    // Fetch radar data for each timestamp
    const radarData = await Promise.all(
      timestamps.map(async (timestamp) => {
        // Format the timestamp for NWS API
        // Format: YYYY-MM-DDTHH:MM:SSZ
        const formattedTime = timestamp.toISOString().replace(/\.\d+Z$/, 'Z');
        
        // NWS Ridge Radar API endpoint for precipitation data
        // This URL fetches the radar image overlay for precipitation
        // Using the calculated bounding box to ensure proper alignment with OSM
        const url = `https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?service=WMS&version=1.3.0&request=GetMap&layers=conus_bref_qcd&styles=&format=image/png&transparent=true&time=${formattedTime}&width=1024&height=768&crs=EPSG:3857&bbox=${bboxMercator.west},${bboxMercator.south},${bboxMercator.east},${bboxMercator.north}`;
        
        // Fetch the radar image
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`Failed to fetch NWS radar data for time ${formattedTime}: ${response.status}`);
          return null;
        }
        
        // Get the image data as array buffer
        const imageBuffer = await response.arrayBuffer();
        
        // Convert to base64 for easier handling in the frontend
        const base64 = Buffer.from(imageBuffer).toString('base64');
        
        return {
          timestamp: timestamp.toISOString(),
          imageData: `data:image/png;base64,${base64}`,
          bbox: bbox, // Include the bounding box for reference
          opacity: opacity // Include the requested opacity
        };
      })
    );
    
    // Filter out any null values (failed fetches)
    const validRadarData = radarData.filter(data => data !== null);
    
    // Return the radar data
    return NextResponse.json({ 
      frames: validRadarData,
      frameCount: validRadarData.length,
      interval,
      bbox: bbox, // Include the bounding box in the response
      opacity: opacity // Include the opacity in the response
    });
    
  } catch (error) {
    console.error('Error fetching NWS radar data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch NWS radar data', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}