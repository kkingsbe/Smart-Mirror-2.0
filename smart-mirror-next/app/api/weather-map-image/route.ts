import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }
  
  try {
    // Validate that the URL is from OpenWeatherMap
    if (!url.startsWith('https://maps.openweathermap.org/')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    
    // Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Determine content type from the original response
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ 
      error: 'Failed to proxy image', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 