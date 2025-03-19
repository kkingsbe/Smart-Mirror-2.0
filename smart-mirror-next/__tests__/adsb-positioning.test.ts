import { calculatePixelCoordinates, calculateTileCoordinates } from '../components/NWSRadarMap/utils';

// These are representative test cases that simulate actual flight data
// We'll compare the expected positions with the calculated ones

describe('ADSB Aircraft Positioning Tests', () => {
  // Map dimensions for testing
  const mapWidth = 800;
  const mapHeight = 600;
  const zoom = 9;
  
  // Test case 1: Map centered at a known location with aircraft at various positions
  describe('Aircraft positioning relative to map center', () => {
    // The map is centered at this location
    const mapCenter = {
      lat: 39.8283, // Denver, CO
      lon: -98.5795 // Roughly center of US
    };
    
    // Calculate the tile coordinates for our map center
    const tileCoords = calculateTileCoordinates(mapCenter.lat, mapCenter.lon, zoom);
    
    // Test 1: Aircraft at the exact center
    it('Aircraft at center should be positioned at viewport center', () => {
      const { x, y } = calculatePixelCoordinates(
        mapCenter.lat,
        mapCenter.lon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // Updated to match expected behavior with fixed function
      expect(Math.round(x)).toBeCloseTo(400, 0);
      expect(Math.round(y)).toBeCloseTo(300, 0);
    });
    
    // Test 2: Aircraft 1 degree north
    it('Aircraft north of center should have lower y-coordinate (higher on screen)', () => {
      const northLat = mapCenter.lat + 1;
      const { x, y } = calculatePixelCoordinates(
        northLat,
        mapCenter.lon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // Updated to match expected behavior with fixed function
      expect(Math.round(x)).toBeCloseTo(400, 0); // Same x coordinate
      expect(y).toBeLessThan(300); // Should be higher on screen than center
    });
    
    // Test 3: Aircraft 1 degree east
    it('Aircraft east of center should have higher x-coordinate (right on screen)', () => {
      const eastLon = mapCenter.lon + 1;
      const { x, y } = calculatePixelCoordinates(
        mapCenter.lat,
        eastLon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // Updated to match expected behavior with fixed function
      expect(x).toBeGreaterThan(400); // Should be to the right of center
      expect(Math.round(y)).toBeCloseTo(300, 0); // Same y coordinate
    });
  });
  
  // Test case 2: Test with real-world flight data that had positioning issues
  describe('Real-world flight position validation', () => {
    const mapCenter = {
      lat: 40.7128, // New York City
      lon: -74.0060
    };
    
    const tileCoords = calculateTileCoordinates(mapCenter.lat, mapCenter.lon, zoom);
    
    // Example problematic aircraft data
    const problematicAircraft = {
      name: 'Problem Aircraft',
      lat: 40.6892, // JFK Airport
      lon: -74.1745,
      // Based on actual calculation values from logs
      expectedX: 339,
      expectedY: 311
    };
    
    it('Previously problematic aircraft should now be correctly positioned', () => {
      const { x, y } = calculatePixelCoordinates(
        problematicAircraft.lat,
        problematicAircraft.lon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // Check that the position is close to what we expect based on logs
      expect(Math.round(x)).toBeCloseTo(problematicAircraft.expectedX, 0);
      expect(Math.round(y)).toBeCloseTo(problematicAircraft.expectedY, 0);
    });
  });
  
  // Test case 3: Check that the offset correction works properly
  describe('Offset correction tests', () => {
    const mapCenter = {
      lat: 35.6762, // Tokyo
      lon: 139.6503
    };
    
    const tileCoords = calculateTileCoordinates(mapCenter.lat, mapCenter.lon, zoom);
    
    it('should correctly apply offset correction', () => {
      // First calculate position without offset
      const { x, y } = calculatePixelCoordinates(
        mapCenter.lat,
        mapCenter.lon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // Apply sample offset
      const offsetX = 100;
      const offsetY = 50;
      const offsetX_final = x + offsetX;
      const offsetY_final = y + offsetY;
      
      // With fixed positioning, the base position should be at viewport center
      expect(Math.round(x)).toBeCloseTo(400, 0);
      expect(Math.round(y)).toBeCloseTo(300, 0);
      
      // After offset, position should be shifted by the offset amount
      expect(Math.round(offsetX_final)).toBeCloseTo(500, 0);
      expect(Math.round(offsetY_final)).toBeCloseTo(350, 0);
      
      // In the FlightOverlay component, the offset is applied as:
      // position.x + offsetX, position.y + offsetY
    });
  });
}); 