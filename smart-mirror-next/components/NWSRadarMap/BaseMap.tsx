import React, { useEffect, useState, useRef } from 'react';
import { TileCoordinates } from './types';
import { getTileUrl } from './utils';

interface BaseMapProps {
  tileCoords: TileCoordinates;
  width: number;
  height: number;
  zoom: number;
  darkTheme: boolean;
  onLoaded?: () => void; // Optional callback when base map has loaded
}

/**
 * Component that displays the base map using OpenStreetMap tiles
 */
const BaseMap: React.FC<BaseMapProps> = ({
  tileCoords,
  width,
  height,
  zoom,
  darkTheme,
  onLoaded,
}) => {
  const [loadedTiles, setLoadedTiles] = useState<Record<string, boolean>>({});
  const [tileUrls, setTileUrls] = useState<Record<string, string>>({});
  const tilesInitialized = useRef(false);
  const baseMapLoaded = useRef(false);

  // Check if enough tiles have loaded to consider the base map ready
  useEffect(() => {
    // Consider the base map loaded when at least 50% of tiles are loaded
    // or after a timeout to prevent waiting forever
    const loadedCount = Object.values(loadedTiles).filter(Boolean).length;
    const totalTiles = Object.keys(tileUrls).length;
    
    if (!baseMapLoaded.current && totalTiles > 0) {
      if (loadedCount >= totalTiles * 0.5 || loadedCount >= 9) {
        console.log(`BaseMap loaded: ${loadedCount}/${totalTiles} tiles`);
        baseMapLoaded.current = true;
        
        // Call the onLoaded callback if provided
        if (onLoaded) {
          onLoaded();
        }
      }
    }
    
    // Set a timeout to ensure the base map is considered loaded
    // even if some tiles fail to load
    const timeoutId = setTimeout(() => {
      if (!baseMapLoaded.current && totalTiles > 0) {
        console.log(`BaseMap timeout: ${loadedCount}/${totalTiles} tiles loaded`);
        baseMapLoaded.current = true;
        
        // Call the onLoaded callback if provided
        if (onLoaded) {
          onLoaded();
        }
      }
    }, 5000); // 5 second timeout
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadedTiles, tileUrls, onLoaded]);

  // Calculate the offset to center the map on the exact coordinates
  const tileSize = 256;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate the position of the center tile
  const centerTileX = Math.round(tileCoords.xtile * tileSize);
  const centerTileY = Math.round(tileCoords.ytile * tileSize);
  
  // Calculate the offset needed to center the exact coordinates
  const xOffset = centerX - centerTileX;
  const yOffset = centerY - centerTileY;
  
  // Calculate the range of tiles needed to cover the viewport
  // Add extra tiles to ensure full coverage
  const tilesNeededX = Math.ceil(width / tileSize) + 2;
  const tilesNeededY = Math.ceil(height / tileSize) + 2;
  const maxTilesNeeded = Math.max(tilesNeededX, tilesNeededY);
  const halfTiles = Math.floor(maxTilesNeeded / 2);
  
  // Generate array of tile offsets needed
  const tileOffsets = Array.from({ length: maxTilesNeeded }, (_, i) => i - halfTiles);
  
  // Initialize tile URLs only once to prevent infinite re-renders
  useEffect(() => {
    if (!tilesInitialized.current) {
      const newTileUrls: Record<string, string> = {};
      
      // Generate all tile URLs at once
      tileOffsets.forEach(yOffset => {
        tileOffsets.forEach(xOffset => {
          const tileX = Math.floor(tileCoords.xtile) + xOffset;
          const tileY = Math.floor(tileCoords.ytile) + yOffset;
          
          // Skip invalid tiles
          if (tileY < 0 || tileY >= Math.pow(2, zoom)) {
            return;
          }
          
          const tileKey = `${tileX},${tileY},${zoom}`;
          
          // Generate URL with a timestamp that won't change during the component's lifecycle
          const timestamp = Date.now();
          const tileUrl = `${getTileUrl(tileX, tileY, zoom, darkTheme)}&t=${timestamp}`;
          
          newTileUrls[tileKey] = tileUrl;
        });
      });
      
      setTileUrls(newTileUrls);
      tilesInitialized.current = true;
    }
  }, [tileCoords, zoom, darkTheme, tileOffsets]);
  
  // Track tile load success
  const handleTileLoad = (tileKey: string) => {
    setLoadedTiles(prev => {
      // Only update if not already loaded to prevent unnecessary re-renders
      if (!prev[tileKey]) {
        console.log(`Tile loaded: ${tileKey}`);
        return {...prev, [tileKey]: true};
      }
      return prev;
    });
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `translate(${xOffset}px, ${yOffset}px)`,
        }}
      >
        {/* Grid of tiles to cover the viewport */}
        {tileOffsets.map((yOffset) => (
          tileOffsets.map((xOffset) => {
            const tileX = Math.floor(tileCoords.xtile) + xOffset;
            const tileY = Math.floor(tileCoords.ytile) + yOffset;
            const tileKey = `${tileX},${tileY},${zoom}`;
            
            // Skip invalid tiles
            if (tileY < 0 || tileY >= Math.pow(2, zoom)) {
              return null;
            }
            
            // Use pre-generated URL from state to prevent infinite re-renders
            const tileUrl = tileUrls[tileKey];
            
            // Skip rendering if URL isn't ready yet
            if (!tileUrl) {
              return null;
            }
            
            return (
              <img 
                key={tileKey}
                src={tileUrl}
                alt={`Map tile ${tileKey}`}
                style={{
                  position: 'absolute',
                  left: `${tileX * tileSize}px`,
                  top: `${tileY * tileSize}px`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  filter: darkTheme ? 'brightness(0.8) contrast(1.2)' : 'none', // Enhance dark theme
                  border: 'none', // Remove debug border that was causing yellow lines
                  display: 'block', // Prevent inline image gaps
                  margin: 0, // Remove any default margins
                  padding: 0, // Remove any default padding
                  imageRendering: 'auto', // Improve image rendering
                }}
                onLoad={() => handleTileLoad(tileKey)}
                onError={(e) => {
                  // Set a fallback background color for failed tiles
                  (e.target as HTMLImageElement).style.backgroundColor = darkTheme ? '#121212' : '#f0f0f0';
                  // Add a visual indicator for failed tiles
                  (e.target as HTMLImageElement).style.border = '1px solid red';
                }}
              />
            );
          })
        ))}
      </div>
    </div>
  );
};

export default BaseMap; 