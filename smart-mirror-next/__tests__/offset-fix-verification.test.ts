import { calculatePixelCoordinates, calculateTileCoordinates } from '../components/NWSRadarMap/utils';

describe('ADSB Position Fix Verification', () => {
  // Map dimensions
  const mapWidth = 800;
  const mapHeight = 600;
  const zoom = 9;
  
  // We no longer need offset correction since we fixed the core positioning logic
  // const offsetCorrection = { x: 204, y: 39 };
  
  describe('Verifying correct positioning', () => {
    // Test cases for different locations
    const testLocations = [
      { name: 'Denver', lat: 39.8283, lon: -98.5795 },
      { name: 'NYC', lat: 40.7128, lon: -74.0060 },
      { name: 'LA', lat: 34.0522, lon: -118.2437 },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'London', lat: 51.5074, lon: -0.1278 }
    ];
    
    testLocations.forEach(location => {
      test(`Aircraft at ${location.name} should be at center with fixed positioning logic`, () => {
        // Calculate tile coordinates based on the map center
        const tileCoords = calculateTileCoordinates(location.lat, location.lon, zoom);
        
        // Calculate pixel coordinates when map is centered on the location
        const { x, y } = calculatePixelCoordinates(
          location.lat,
          location.lon,
          tileCoords,
          zoom,
          mapWidth,
          mapHeight
        );
        
        // No offset correction needed anymore
        const finalX = x;
        const finalY = y;
        
        // Log the results
        console.log(`${location.name} position:`, {
          position: { x, y },
          mapCenter: { x: mapWidth / 2, y: mapHeight / 2 },
          diff: { 
            x: Math.abs(finalX - mapWidth / 2), 
            y: Math.abs(finalY - mapHeight / 2) 
          }
        });
        
        // With fixed positioning, the aircraft should be very close to the center
        const centerX = mapWidth / 2;
        const centerY = mapHeight / 2;
        
        expect(Math.abs(finalX - centerX)).toBeLessThan(50);
        expect(Math.abs(finalY - centerY)).toBeLessThan(50);
      });
    });
  });
  
  // Test that nearby aircraft are relatively positioned correctly
  describe('Relative positioning verification', () => {
    test('Aircraft north of center should appear above center', () => {
      // Use Denver as base location
      const center = { lat: 39.8283, lon: -98.5795 };
      const north = { lat: center.lat + 1, lon: center.lon }; // 1 degree north
      
      // Get tile coordinates for the map center
      const tileCoords = calculateTileCoordinates(center.lat, center.lon, zoom);
      
      // Calculate positions using map centered on the base location
      const centerPos = calculatePixelCoordinates(
        center.lat, center.lon, tileCoords, zoom, mapWidth, mapHeight
      );
      
      const northPos = calculatePixelCoordinates(
        north.lat, north.lon, tileCoords, zoom, mapWidth, mapHeight
      );
      
      // Log the positions
      console.log('Relative position test:', {
        center: centerPos,
        north: northPos,
        diff: {
          x: northPos.x - centerPos.x,
          y: northPos.y - centerPos.y
        }
      });
      
      // North should have approximately the same x, but smaller y (higher on screen)
      expect(Math.abs(northPos.x - centerPos.x)).toBeLessThan(5);
      expect(northPos.y).toBeLessThan(centerPos.y);
    });
    
    test('Aircraft east of center should appear right of center', () => {
      // Use Denver as base location
      const center = { lat: 39.8283, lon: -98.5795 };
      const east = { lat: center.lat, lon: center.lon + 1 }; // 1 degree east
      
      // Get tile coordinates for the map center
      const tileCoords = calculateTileCoordinates(center.lat, center.lon, zoom);
      
      // Calculate positions using map centered on the base location
      const centerPos = calculatePixelCoordinates(
        center.lat, center.lon, tileCoords, zoom, mapWidth, mapHeight
      );
      
      const eastPos = calculatePixelCoordinates(
        east.lat, east.lon, tileCoords, zoom, mapWidth, mapHeight
      );
      
      // Log the positions
      console.log('Relative position test:', {
        center: centerPos,
        east: eastPos,
        diff: {
          x: eastPos.x - centerPos.x,
          y: eastPos.y - centerPos.y
        }
      });
      
      // East should have approximately the same y, but larger x (right on screen)
      expect(Math.abs(eastPos.y - centerPos.y)).toBeLessThan(5);
      expect(eastPos.x).toBeGreaterThan(centerPos.x);
    });
  });
}); 