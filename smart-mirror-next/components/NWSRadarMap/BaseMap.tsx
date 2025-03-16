import React from 'react';
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
  const tilesNeeded = Math.ceil(Math.max(width, height) / tileSize) + 1;
  const halfTiles = Math.floor(tilesNeeded / 2);
  
  // Generate array of tile offsets needed
  const tileOffsets = Array.from({ length: tilesNeeded }, (_, i) => i - halfTiles);
  
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
              />
            );
          })
        ))}
      </div>
    </div>
  );
};

export default BaseMap; 