import { calculatePixelCoordinates, calculateTileCoordinates } from '../components/NWSRadarMap/utils';

describe('ADSB Aircraft Positioning', () => {
  // Test data
  const mapWidth = 800;
  const mapHeight = 600;
  const zoom = 8;
  
  // Known location with expected coordinates
  // These values are updated for the fixed positioning logic
  const testLocation = {
    lat: 37.7749, // San Francisco lat
    lon: -122.4194, // San Francisco lon
    expected: {
      // Values for centered aircraft with fixed positioning
      x: 400, 
      y: 300
    }
  };
  
  describe('calculatePixelCoordinates', () => {
    test('should correctly position aircraft at the center when map is centered on same location', () => {
      // First calculate the tile coordinates for our test location
      const tileCoords = calculateTileCoordinates(testLocation.lat, testLocation.lon, zoom);
      
      // Then calculate the pixel coordinates using those tile coordinates
      const { x, y } = calculatePixelCoordinates(
        testLocation.lat,
        testLocation.lon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // The aircraft should be positioned at the center with our fixed positioning logic
      expect(Math.round(x)).toBeCloseTo(testLocation.expected.x, 0);
      expect(Math.round(y)).toBeCloseTo(testLocation.expected.y, 0);
    });
    
    it("should correctly position aircraft north of the map center", () => {
      // San Francisco
      const center = {
        lat: 37.7749,
        lon: -122.4194,
        zoom: 8
      };
      
      // 1 degree north of San Francisco
      const north = {
        lat: center.lat + 1,
        lon: center.lon,
        zoom: center.zoom
      };
      
      // Get tile coordinates as if map is centered on San Francisco
      const tileCoords = calculateTileCoordinates(center.lat, center.lon, center.zoom);
      
      // Calculate position of the aircraft to the north
      const { x, y } = calculatePixelCoordinates(
        north.lat, 
        north.lon, 
        tileCoords, 
        north.zoom, 
        800, 
        600
      );
      
      // With fixed positioning, x should stay the same, y should be lower (higher on screen)
      expect(Math.round(x)).toBeCloseTo(400, 0); // Same x coordinate
      expect(y).toBeLessThan(300); // Should be higher on screen than the center point
    });
    
    it("should correctly position aircraft east of the map center", () => {
      // San Francisco
      const center = {
        lat: 37.7749,
        lon: -122.4194,
        zoom: 8
      };
      
      // 1 degree east of San Francisco
      const east = {
        lat: center.lat,
        lon: center.lon + 1,
        zoom: center.zoom
      };
      
      // Get tile coordinates as if map is centered on San Francisco
      const tileCoords = calculateTileCoordinates(center.lat, center.lon, center.zoom);
      
      // Calculate position of the aircraft to the east
      const { x, y } = calculatePixelCoordinates(
        east.lat, 
        east.lon, 
        tileCoords, 
        east.zoom, 
        800, 
        600
      );
      
      // With fixed positioning, x should be greater, y should stay the same
      expect(x).toBeGreaterThan(400); // Should be to the right of the center point
      expect(Math.round(y)).toBeCloseTo(300, 0); // Same y coordinate
    });
  });
}); 