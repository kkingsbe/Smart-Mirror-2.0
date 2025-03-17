import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch NWS weather alerts
 * 
 * This endpoint fetches active weather alerts from the National Weather Service API
 * for a specified location and radius.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get parameters from the request
  const lat = parseFloat(searchParams.get('lat') || '39.8283'); // Default to center of US
  const lon = parseFloat(searchParams.get('lon') || '-98.5795');
  const radius = parseInt(searchParams.get('radius') || '20'); // Default to 20 miles
  
  try {
    // Convert the lat/lon to a NWS grid point
    // NWS API requires grid coordinates for many endpoints
    const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
    const pointResponse = await fetch(pointUrl, {
      headers: {
        'User-Agent': '(Smart Mirror, your-email@example.com)', // Replace with your contact info
        'Accept': 'application/geo+json'
      }
    });
    
    // If the location is not supported by NWS, return empty alerts
    if (pointResponse.status === 404) {
      console.log(`Location ${lat},${lon} not supported by NWS API`);
      return NextResponse.json({ 
        alerts: [],
        count: 0,
        location: {
          lat,
          lon,
          radius
        }
      });
    }
    
    if (!pointResponse.ok) {
      throw new Error(`Failed to fetch NWS grid point: ${pointResponse.status}`);
    }
    
    const pointData = await pointResponse.json();
    
    // Get the county/zone for the location
    // This is needed to fetch alerts for the specific area
    const countyUrl = pointData.properties.county;
    const countyResponse = await fetch(countyUrl, {
      headers: {
        'User-Agent': '(Smart Mirror, your-email@example.com)', // Replace with your contact info
        'Accept': 'application/geo+json'
      }
    });
    
    // If county data is not available, return empty alerts
    if (countyResponse.status === 404) {
      console.log(`County data not available for location ${lat},${lon}`);
      return NextResponse.json({ 
        alerts: [],
        count: 0,
        location: {
          lat,
          lon,
          radius
        }
      });
    }
    
    if (!countyResponse.ok) {
      throw new Error(`Failed to fetch county data: ${countyResponse.status}`);
    }
    
    const countyData = await countyResponse.json();
    const zoneId = countyData.properties.id;
    
    // Fetch active alerts for the zone
    console.log('Fetching alerts for zone:', zoneId);
    const alertsUrl = `https://api.weather.gov/alerts/active?zone=${zoneId}`;
    const alertsResponse = await fetch(alertsUrl, {
      headers: {
        'User-Agent': '(Smart Mirror, your-email@example.com)', // Replace with your contact info
        'Accept': 'application/geo+json'
      }
    });
    
    if (!alertsResponse.ok) {
      throw new Error(`Failed to fetch alerts: ${alertsResponse.status}`);
    }
    
    const alertsData = await alertsResponse.json();
    
    // Also fetch alerts for a wider area to catch alerts that might affect the location
    // but aren't specifically for the county/zone
    const areaAlertUrl = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;
    const areaAlertResponse = await fetch(areaAlertUrl, {
      headers: {
        'User-Agent': '(Smart Mirror, your-email@example.com)', // Replace with your contact info
        'Accept': 'application/geo+json'
      }
    });
    
    let areaAlerts = [];
    if (areaAlertResponse.ok) {
      const areaAlertData = await areaAlertResponse.json();
      areaAlerts = areaAlertData.features || [];
    }
    
    // Combine and process alerts
    const allAlertFeatures = [...(alertsData.features || []), ...areaAlerts];
    
    // Filter out duplicates by alert ID
    const uniqueAlerts = Array.from(
      new Map(allAlertFeatures.map(feature => [feature.properties.id, feature])).values()
    );
    
    // Calculate distance between two points using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 3958.8; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    // Filter alerts by distance if they have a specific point
    // Otherwise include all alerts for the zone
    const filteredAlerts = uniqueAlerts.filter(feature => {
      // If the alert has a specific point, check if it's within the radius
      if (feature.geometry && feature.geometry.type === 'Point') {
        const alertLon = feature.geometry.coordinates[0];
        const alertLat = feature.geometry.coordinates[1];
        const distance = calculateDistance(lat, lon, alertLat, alertLon);
        return distance <= radius;
      }
      
      // If no specific point, include all alerts for the zone
      return true;
    });
    
    // Transform the alerts into a simpler format
    const processedAlerts = filteredAlerts.map(feature => {
      const props = feature.properties;
      return {
        id: props.id,
        event: props.event,
        headline: props.headline,
        description: props.description,
        severity: props.severity,
        urgency: props.urgency,
        effective: props.effective,
        expires: props.expires,
        areaDesc: props.areaDesc
      };
    });
    
    // Return the alerts
    return NextResponse.json({ 
      alerts: processedAlerts,
      count: processedAlerts.length,
      location: {
        lat,
        lon,
        radius
      }
    });
    
  } catch (error) {
    console.error('Error fetching NWS alerts:', error);
    // Return empty alerts array instead of error for unsupported locations
    return NextResponse.json({ 
      alerts: [],
      count: 0,
      location: {
        lat,
        lon,
        radius
      }
    });
  }
} 