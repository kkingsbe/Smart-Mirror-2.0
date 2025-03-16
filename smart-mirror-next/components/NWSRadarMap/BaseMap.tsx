import React, { useEffect } from 'react';
import { TileCoordinates } from './types';
import { getTileUrl } from './utils';

interface BaseMapProps {
  tileCoords: TileCoordinates;
  width: number;
  height: number;
  zoom: number;
  darkTheme: boolean;
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
}) => {
  // Add debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('BaseMap props:', { tileCoords, width, height, zoom, darkTheme });
    }
  }, [tileCoords, width, height, zoom, darkTheme]);

  // Calculate the offset to center the map on the exact coordinates
  const tileSize = 256;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate the position of the center tile
  const centerTileX = tileCoords.xtile * tileSize;
  const centerTileY = tileCoords.ytile * tileSize;
  
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
            
            // Skip invalid tiles
            if (tileY < 0 || tileY >= Math.pow(2, zoom)) {
              return null;
            }
            
            return (
              <img 
                key={`${tileX}-${tileY}`}
                src={getTileUrl(tileX, tileY, zoom, darkTheme)}
                alt={`Map tile ${tileX},${tileY}`}
                style={{
                  position: 'absolute',
                  left: `${tileX * tileSize}px`,
                  top: `${tileY * tileSize}px`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  filter: darkTheme ? 'brightness(0.8) contrast(1.2)' : 'none', // Enhance dark theme
                }}
                onError={(e) => {
                  // Log tile loading errors in development
                  if (process.env.NODE_ENV !== 'production') {
                    console.error(`Failed to load tile: ${tileX},${tileY},${zoom}`);
                  }
                  // Set a fallback background color for failed tiles
                  (e.target as HTMLImageElement).style.backgroundColor = darkTheme ? '#121212' : '#f0f0f0';
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