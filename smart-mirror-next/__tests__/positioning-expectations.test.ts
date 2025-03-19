import { calculatePixelCoordinates, calculateTileCoordinates } from '../components/NWSRadarMap/utils';

describe('ADSB Aircraft Positioning - Expected Correct Behavior', () => {
  // Standard map dimensions for testing
  const mapWidth = 800;
  const mapHeight = 600;
  const zoom = 9;
  
  describe('Basic positioning expectations', () => {
    test('Aircraft at the map center coordinates should be positioned at the viewport center', () => {
      // For any location, when the map is centered on that location,
      // an aircraft at those exact coordinates should appear at the center of the viewport
      const location = {
        lat: 39.8283, // Denver, CO
        lon: -98.5795 // Roughly center of US
      };
      
      // Calculate tile coordinates for the map centered at this location
      const tileCoords = calculateTileCoordinates(location.lat, location.lon, zoom);
      
      // Calculate pixel coordinates for an aircraft at the same location
      const { x, y } = calculatePixelCoordinates(
        location.lat,
        location.lon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // The aircraft should be positioned exactly at the center of the map
      expect(Math.round(x)).toBe(Math.round(mapWidth / 2));
      expect(Math.round(y)).toBe(Math.round(mapHeight / 2));
    });
    
    test('Aircraft north of map center should appear above center (smaller y value)', () => {
      const center = {
        lat: 39.8283, // Denver, CO
        lon: -98.5795 // Roughly center of US
      };
      
      // Calculate tile coordinates for the map centered at this location
      const tileCoords = calculateTileCoordinates(center.lat, center.lon, zoom);
      
      // Position an aircraft 1 degree north of the center
      const northLat = center.lat + 1.0;
      const { x, y } = calculatePixelCoordinates(
        northLat,
        center.lon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // The aircraft should:
      // 1. Have the same x-coordinate as the center (or very close)
      // 2. Have a smaller y-coordinate than the center (higher on screen)
      expect(Math.round(x)).toBe(Math.round(mapWidth / 2));
      expect(y).toBeLessThan(mapHeight / 2);
    });
    
    test('Aircraft east of map center should appear right of center (larger x value)', () => {
      const center = {
        lat: 39.8283, // Denver, CO
        lon: -98.5795 // Roughly center of US
      };
      
      // Calculate tile coordinates for the map centered at this location
      const tileCoords = calculateTileCoordinates(center.lat, center.lon, zoom);
      
      // Position an aircraft 1 degree east of the center
      const eastLon = center.lon + 1.0;
      const { x, y } = calculatePixelCoordinates(
        center.lat,
        eastLon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // The aircraft should:
      // 1. Have a larger x-coordinate than the center (right on screen)
      // 2. Have the same y-coordinate as the center (or very close)
      expect(x).toBeGreaterThan(mapWidth / 2);
      expect(Math.round(y)).toBe(Math.round(mapHeight / 2));
    });
  });
  
  describe('Positioning consistency across different locations', () => {
    // Test multiple locations to ensure the logic works everywhere
    const testLocations = [
      { name: 'Denver', lat: 39.8283, lon: -98.5795 },
      { name: 'NYC', lat: 40.7128, lon: -74.0060 },
      { name: 'LA', lat: 34.0522, lon: -118.2437 },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'London', lat: 51.5074, lon: -0.1278 }
    ];
    
    testLocations.forEach(location => {
      test(`Aircraft at ${location.name} coordinates should be at viewport center when map centered at same location`, () => {
        // Calculate tile coordinates for the map centered at this location
        const tileCoords = calculateTileCoordinates(location.lat, location.lon, zoom);
        
        // Calculate pixel coordinates for an aircraft at the same location
        const { x, y } = calculatePixelCoordinates(
          location.lat,
          location.lon,
          tileCoords,
          zoom,
          mapWidth,
          mapHeight
        );
        
        // The aircraft should be positioned exactly at the center of the map
        expect(Math.round(x)).toBe(Math.round(mapWidth / 2));
        expect(Math.round(y)).toBe(Math.round(mapHeight / 2));
      });
    });
  });
  
  describe('Relative positioning between aircraft', () => {
    test('Multiple aircraft should maintain correct relative positions', () => {
      // Center the map on Denver
      const center = {
        lat: 39.8283,
        lon: -98.5795
      };
      
      const tileCoords = calculateTileCoordinates(center.lat, center.lon, zoom);
      
      // Define a set of aircraft at different positions
      const aircraft = [
        { name: 'Center', lat: center.lat, lon: center.lon },
        { name: 'North', lat: center.lat + 1, lon: center.lon },
        { name: 'East', lat: center.lat, lon: center.lon + 1 },
        { name: 'South', lat: center.lat - 1, lon: center.lon },
        { name: 'West', lat: center.lat, lon: center.lon - 1 }
      ];
      
      // Calculate positions for all aircraft
      const positions = aircraft.map(plane => ({
        name: plane.name,
        position: calculatePixelCoordinates(
          plane.lat,
          plane.lon,
          tileCoords,
          zoom,
          mapWidth,
          mapHeight
        )
      }));
      
      // Find the center aircraft position
      const centerPosition = positions.find(p => p.name === 'Center')!.position;
      
      // Verify the center aircraft is at the center of the viewport
      expect(Math.round(centerPosition.x)).toBe(Math.round(mapWidth / 2));
      expect(Math.round(centerPosition.y)).toBe(Math.round(mapHeight / 2));
      
      // Verify north aircraft is above center
      const northPosition = positions.find(p => p.name === 'North')!.position;
      expect(Math.round(northPosition.x)).toBe(Math.round(centerPosition.x));
      expect(northPosition.y).toBeLessThan(centerPosition.y);
      
      // Verify east aircraft is to the right of center
      const eastPosition = positions.find(p => p.name === 'East')!.position;
      expect(eastPosition.x).toBeGreaterThan(centerPosition.x);
      expect(Math.round(eastPosition.y)).toBe(Math.round(centerPosition.y));
      
      // Verify south aircraft is below center
      const southPosition = positions.find(p => p.name === 'South')!.position;
      expect(Math.round(southPosition.x)).toBe(Math.round(centerPosition.x));
      expect(southPosition.y).toBeGreaterThan(centerPosition.y);
      
      // Verify west aircraft is to the left of center
      const westPosition = positions.find(p => p.name === 'West')!.position;
      expect(westPosition.x).toBeLessThan(centerPosition.x);
      expect(Math.round(westPosition.y)).toBe(Math.round(centerPosition.y));
    });
  });
}); 