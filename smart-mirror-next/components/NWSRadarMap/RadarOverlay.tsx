import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
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
 * Optimized for performance on slower devices like Raspberry Pi
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
  const [loadErrors, setLoadErrors] = useState<boolean[]>([]);
  const [renderAttempt, setRenderAttempt] = useState<number>(0);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  
  // Debug info for production troubleshooting
  useEffect(() => {
    console.log('RadarOverlay render:', {
      framesCount: frames.length,
      currentFrame,
      preloadedCount: preloaded.filter(Boolean).length,
      loadErrorsCount: loadErrors.filter(Boolean).length,
      renderAttempt,
      environment: process.env.NODE_ENV
    });
  }, [frames.length, currentFrame, preloaded, loadErrors, renderAttempt]);
  
  // Preload images progressively to avoid overwhelming the device
  useEffect(() => {
    if (frames.length === 0) return;
    
    // Initialize preloaded state if needed
    if (preloaded.length !== frames.length) {
      setPreloaded(new Array(frames.length).fill(false));
      setLoadErrors(new Array(frames.length).fill(false));
      imagesRef.current = new Array(frames.length).fill(null);
    }
    
    // Progressive loading - prioritize the current frame and a few frames around it
    const loadPriority = [
      currentFrame, // Current frame first
      ...[...Array(frames.length).keys()].filter(i => i !== currentFrame) // Then the rest
    ];
    
    // Load images one by one with a small delay to prevent overwhelming the device
    let loadIndex = 0;
    
    const loadNextImage = () => {
      if (loadIndex >= loadPriority.length) return;
      
      const frameIndex = loadPriority[loadIndex];
      
      // Skip already loaded or errored frames
      if (preloaded[frameIndex] || loadErrors[frameIndex]) {
        loadIndex++;
        setTimeout(loadNextImage, 10);
        return;
      }
      
      // Create a new image element
      const img = new window.Image();
      img.src = frames[frameIndex].imageData;
      
      img.onload = () => {
        setPreloaded(prev => {
          const newState = [...prev];
          newState[frameIndex] = true;
          return newState;
        });
        
        loadIndex++;
        // Add a small delay between loading images to prevent overwhelming the device
        setTimeout(loadNextImage, 50);
      };
      
      img.onerror = () => {
        console.error(`Failed to load radar frame ${frameIndex}`);
        setLoadErrors(prev => {
          const newState = [...prev];
          newState[frameIndex] = true;
          return newState;
        });
        
        // If the current frame fails to load, try to reload it after a delay
        if (frameIndex === currentFrame && renderAttempt < 3) {
          setTimeout(() => {
            setRenderAttempt(prev => prev + 1);
          }, 1000);
        }
        
        loadIndex++;
        setTimeout(loadNextImage, 50);
      };
      
      // Store reference to the image
      imagesRef.current[frameIndex] = img;
    };
    
    // Start loading images
    loadNextImage();
    
    // Cleanup function
    return () => {
      // Clear image references to prevent memory leaks
      imagesRef.current.forEach((img) => {
        if (img) {
          img.onload = null;
          img.onerror = null;
        }
      });
    };
  }, [frames, currentFrame, renderAttempt, loadErrors, preloaded]);
  
  // Only render the current frame and the next frame to reduce DOM elements
  const visibleFrames = frames.filter((_, index) => 
    index === currentFrame || 
    index === (currentFrame + 1) % frames.length
  );
  
  const visibleFrameIndices = visibleFrames.map((frame) => 
    frames.findIndex(f => f === frame)
  );

  return (
    <>
      {/* Only render the current frame and the next frame to reduce DOM elements */}
      {visibleFrames.map((frame, i) => {
        const originalIndex = visibleFrameIndices[i];
        const isCurrentFrame = originalIndex === currentFrame;
        
        return (
          <div
            key={originalIndex}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: isCurrentFrame && (loadedFrames.length === 0 || loadedFrames[originalIndex]) ? opacity : 0,
              transition: 'opacity 0.3s ease-in-out',
              overflow: 'hidden',
              zIndex: 5,
              visibility: isCurrentFrame ? 'visible' : 'hidden',
            }}
          >
            {preloaded[originalIndex] && !loadErrors[originalIndex] && (
              <Image
                src={frame.imageData}
                alt={`Weather radar frame ${originalIndex + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  mixBlendMode: darkTheme ? 'screen' : 'normal',
                }}
                fill
                priority
                unoptimized // Use unoptimized for data URLs
                onError={() => {
                  // Handle runtime errors
                  setLoadErrors(prev => {
                    const newState = [...prev];
                    newState[originalIndex] = true;
                    return newState;
                  });
                }}
              />
            )}
            
            {/* Show loading indicator if frame is not loaded yet */}
            {(!preloaded[originalIndex] && !loadErrors[originalIndex] && isCurrentFrame) && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '1.2rem',
              }}>
                Loading radar...
              </div>
            )}
            
            {/* Show error message if frame failed to load */}
            {(loadErrors[originalIndex] && isCurrentFrame) && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                background: 'rgba(255, 0, 0, 0.5)',
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '1.2rem',
              }}>
                Error loading radar
              </div>
            )}
          </div>
        );
      })}
      
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