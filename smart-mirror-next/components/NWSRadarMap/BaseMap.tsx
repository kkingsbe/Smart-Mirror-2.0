import React, { useEffect, useState, useRef } from 'react';
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
  const [tileUrls, setTileUrls] = useState<Record<string, string>>({});
  const tilesInitialized = useRef(false);
  
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
  
  // Track tile load errors
  const handleTileError = (tileKey: string, tileX: number, tileY: number, tileZoom: number) => {
    setTileErrors(prev => {
      // Only update if not already errored to prevent unnecessary re-renders
      if (!prev[tileKey]) {
        console.error(`Failed to load tile: ${tileKey} (${tileX},${tileY},${tileZoom})`);
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