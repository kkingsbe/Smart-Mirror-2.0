import React, { useEffect, useState } from 'react';
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
  const [loadedTiles, setLoadedTiles] = useState<Record<string, boolean>>({});
  const [tileErrors, setTileErrors] = useState<Record<string, boolean>>({});
  
  // Add debugging in both development and production
  useEffect(() => {
    console.log('BaseMap props:', { 
      tileCoords, 
      width, 
      height, 
      zoom, 
      darkTheme,
      environment: process.env.NODE_ENV,
      nextPublicEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || 'not-vercel'
    });
    
    // In production, add a debug element to show tile loading status
    if (process.env.NODE_ENV === 'production') {
      const debugElement = document.createElement('div');
      debugElement.id = 'basemap-debug';
      debugElement.style.position = 'fixed';
      debugElement.style.top = '10px';
      debugElement.style.left = '10px';
      debugElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
      debugElement.style.color = 'white';
      debugElement.style.padding = '5px';
      debugElement.style.fontSize = '10px';
      debugElement.style.zIndex = '9999';
      debugElement.style.maxWidth = '300px';
      debugElement.style.maxHeight = '200px';
      debugElement.style.overflow = 'auto';
      document.body.appendChild(debugElement);
      
      return () => {
        if (document.body.contains(debugElement)) {
          document.body.removeChild(debugElement);
        }
      };
    }
  }, [tileCoords, width, height, zoom, darkTheme]);
  
  // Update debug info when tiles load or error
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const debugElement = document.getElementById('basemap-debug');
      if (debugElement) {
        const loadedCount = Object.values(loadedTiles).filter(Boolean).length;
        const errorCount = Object.values(tileErrors).filter(Boolean).length;
        
        debugElement.innerHTML = `
          <div>Tiles: ${loadedCount} loaded, ${errorCount} errors</div>
          <div>Center: x=${Math.floor(tileCoords.xtile)}, y=${Math.floor(tileCoords.ytile)}</div>
          <div>Zoom: ${zoom}</div>
          <div>First loaded: ${Object.keys(loadedTiles).slice(0, 3).join(', ')}</div>
          <div>First errors: ${Object.keys(tileErrors).slice(0, 3).join(', ')}</div>
        `;
      }
    }
  }, [loadedTiles, tileErrors, tileCoords, zoom]);

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
  
  // Track tile load success
  const handleTileLoad = (tileKey: string) => {
    setLoadedTiles(prev => ({...prev, [tileKey]: true}));
    console.log(`Tile loaded: ${tileKey}`);
  };
  
  // Track tile load errors
  const handleTileError = (tileKey: string, tileX: number, tileY: number, tileZoom: number) => {
    setTileErrors(prev => ({...prev, [tileKey]: true}));
    console.error(`Failed to load tile: ${tileKey} (${tileX},${tileY},${tileZoom})`);
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
            
            // Get the tile URL with a cache-busting parameter for production
            const tileUrl = process.env.NODE_ENV === 'production' 
              ? `${getTileUrl(tileX, tileY, zoom, darkTheme)}&t=${Date.now()}` 
              : getTileUrl(tileX, tileY, zoom, darkTheme);
            
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
                  border: process.env.NODE_ENV === 'production' ? '1px solid rgba(255,0,0,0.2)' : 'none', // Visual debug in production
                }}
                onLoad={() => handleTileLoad(tileKey)}
                onError={(e) => {
                  handleTileError(tileKey, tileX, tileY, zoom);
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