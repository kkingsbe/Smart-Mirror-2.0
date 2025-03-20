import { NextRequest, NextResponse } from 'next/server';

// Completely disable caching for this route
export const dynamic = 'force-dynamic';

// OpenWeatherMap API endpoint for hourly forecast
const API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
// You should set this in your .env file
const API_KEY = process.env.OPENWEATHERMAP_API_KEY || '';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Fetch 5-day forecast with 3-hour intervals (we'll filter to 24 hours)
    const response = await fetch(
      `${API_URL}?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
      { 
        cache: 'no-store', 
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      throw new Error(`Weather API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Extract the first 8 entries (24 hours, as each entry is 3 hours)
    // Sort entries to ensure they're in chronological order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next24Hours = data.list.slice(0, 8).map((item: any) => {
      // Round temperature to nearest integer for cleaner display
      const temp = Math.round(item.main.temp);
      const feels_like = Math.round(item.main.feels_like);
      
      // Capitalize first letter of each word in description
      const description = item.weather[0].description
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        time: item.dt * 1000, // Convert to milliseconds
        temp,
        feels_like,
        weather: {
          main: item.weather[0].main,
          description: description,
          icon: item.weather[0].icon
        }
      };
    });

    return NextResponse.json({ forecast: next24Hours }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 