import React, { useEffect, useState } from 'react';
import { RadarFrame } from './types';

interface RadarOverlayProps {
  frames: RadarFrame[];
  currentFrame: number;
  opacity: number;
  darkTheme: boolean;
  loadedFrames?: boolean[];
}

/**
 * Component that displays the radar frames as an overlay on the map
 * Optimized to keep all frames loaded in the DOM for instant transitions
 */
const RadarOverlay: React.FC<RadarOverlayProps> = ({
  frames,
  currentFrame,
  opacity,
  darkTheme,
  loadedFrames = [],
}) => {
  // Track if all images have been preloaded
  const [preloaded, setPreloaded] = useState<boolean[]>([]);
  
  // Preload all images when the component mounts or frames change
  useEffect(() => {
    if (frames.length === 0) return;
    
    // Initialize preloaded state if needed
    if (preloaded.length !== frames.length) {
      setPreloaded(new Array(frames.length).fill(false));
    }
  }, [frames, preloaded.length]);
  
  // Handle image preloading
  const handleImageLoad = (index: number) => {
    if (!preloaded[index]) {
      const newPreloaded = [...preloaded];
      newPreloaded[index] = true;
      setPreloaded(newPreloaded);
    }
  };

  return (
    <>
      {frames.map((frame, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: index === currentFrame && (loadedFrames.length === 0 || loadedFrames[index]) ? opacity : 0,
            transition: 'opacity 0.2s ease-in-out',
            overflow: 'hidden',
            zIndex: 5,
            // Keep all frames in the DOM with visibility property instead of removing them
            visibility: 'visible',
          }}
        >
          <img
            src={frame.imageData}
            alt={`Weather radar frame ${index + 1}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              mixBlendMode: darkTheme ? 'screen' : 'normal', // Improve visibility on dark backgrounds
            }}
            // Preload images and track loading state
            onLoad={() => handleImageLoad(index)}
            // Use loading="eager" to prioritize loading
            loading="eager"
          />
        </div>
      ))}
      
      {/* Frame timestamp indicator */}
      {frames.length > 0 && currentFrame < frames.length && (
        <div style={{
          position: 'absolute',
          bottom: 5,
          right: 5,
          fontSize: '1.5rem',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '3px 6px',
          borderRadius: '3px',
          zIndex: 100
        }}>
          {new Date(frames[currentFrame].timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      )}
    </>
  );
};

export default RadarOverlay; 