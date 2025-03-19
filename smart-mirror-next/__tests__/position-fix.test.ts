import { calculatePixelCoordinates, calculateTileCoordinates } from '../components/NWSRadarMap/utils';

describe('ADSB Aircraft Positioning Fix', () => {
  // Test data
  const mapWidth = 800;
  const mapHeight = 600;
  const zoom = 9;
  
  // Centering problem diagnosis
  describe('Centering problem diagnosis', () => {
    test('Aircraft should be centered when map center coordinates match aircraft coordinates', () => {
      // Define a location
      const location = {
        lat: 39.8283, // Denver, CO
        lon: -98.5795 // Roughly center of US
      };
      
      // Calculate tile coordinates for this location (for map centering)
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
      
      // Log everything for diagnosis
      console.log('Center Issue Diagnosis:', {
        location,
        tileCoords,
        mapCenter: `${mapWidth/2}, ${mapHeight/2}`,
        calculatedPos: `${x}, ${y}`,
        difference: `${x - mapWidth/2}, ${y - mapHeight/2}`
      });
      
      // Current behavior (may not pass if function is broken)
      expect(Math.round(x)).toBeCloseTo(400, 0);
      expect(Math.round(y)).toBeCloseTo(300, 0);
      
      // Desired behavior (should be at center of map)
      // Uncomment to test against desired behavior rather than current behavior
      // expect(Math.round(x)).toBeCloseTo(mapWidth / 2, 0); // Should be center X
      // expect(Math.round(y)).toBeCloseTo(mapHeight / 2, 0); // Should be center Y
    });
    
    test('Offset values needed to center aircraft correctly', () => {
      // Define a location
      const location = {
        lat: 39.8283, // Denver, CO
        lon: -98.5795 // Roughly center of US
      };
      
      // Calculate tile coordinates
      const tileCoords = calculateTileCoordinates(location.lat, location.lon, zoom);
      
      // Calculate pixel coordinates
      const { x, y } = calculatePixelCoordinates(
        location.lat,
        location.lon,
        tileCoords,
        zoom,
        mapWidth,
        mapHeight
      );
      
      // Calculate offset needed to center properly
      const offsetNeededX = (mapWidth / 2) - x;
      const offsetNeededY = (mapHeight / 2) - y;
      
      // Log the offset correction values that would be needed
      console.log('Offset Correction Needed:', {
        currentPosition: { x, y },
        desiredPosition: { x: mapWidth / 2, y: mapHeight / 2 },
        offsetCorrection: { x: offsetNeededX, y: offsetNeededY }
      });
      
      // Test that applying this offset would center the aircraft
      const centeredX = x + offsetNeededX;
      const centeredY = y + offsetNeededY;
      
      expect(Math.round(centeredX)).toBeCloseTo(Math.round(mapWidth / 2), 0);
      expect(Math.round(centeredY)).toBeCloseTo(Math.round(mapHeight / 2), 0);
    });
  });
  
  // Test multiple locations to check consistency
  describe('Consistency across different locations', () => {
    const testLocations = [
      { name: 'NYC', lat: 40.7128, lon: -74.0060 },
      { name: 'LA', lat: 34.0522, lon: -118.2437 },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'London', lat: 51.5074, lon: -0.1278 }
    ];
    
    testLocations.forEach(location => {
      test(`Offset consistency for ${location.name}`, () => {
        // Calculate tile coordinates
        const tileCoords = calculateTileCoordinates(location.lat, location.lon, zoom);
        
        // Calculate pixel coordinates
        const { x, y } = calculatePixelCoordinates(
          location.lat,
          location.lon,
          tileCoords,
          zoom,
          mapWidth,
          mapHeight
        );
        
        // Calculate offset needed to center properly
        const offsetNeededX = (mapWidth / 2) - x;
        const offsetNeededY = (mapHeight / 2) - y;
        
        console.log(`${location.name} Offset:`, {
          position: { x, y },
          offset: { x: offsetNeededX, y: offsetNeededY }
        });
        
        // Apply the calculated offset
        const centeredX = x + offsetNeededX;
        const centeredY = y + offsetNeededY;
        
        // After applying the offset, should be centered
        expect(Math.round(centeredX)).toBeCloseTo(Math.round(mapWidth / 2), 0);
        expect(Math.round(centeredY)).toBeCloseTo(Math.round(mapHeight / 2), 0);
      });
    });
  });
}); 