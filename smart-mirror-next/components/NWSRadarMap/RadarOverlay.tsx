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
  const [prevFrame, setPrevFrame] = useState<number>(currentFrame);
  
  // Track frame changes for smooth crossfade
  useEffect(() => {
    if (currentFrame !== prevFrame) {
      setPrevFrame(currentFrame);
    }
  }, [currentFrame, prevFrame]);
  
  // Debug info for production troubleshooting
  useEffect(() => {
    console.log('RadarOverlay render:', {
      framesCount: frames.length,
      currentFrame,
      prevFrame,
      preloadedCount: preloaded.filter(Boolean).length,
      loadErrorsCount: loadErrors.filter(Boolean).length,
      renderAttempt,
      environment: process.env.NODE_ENV
    });
  }, [frames.length, currentFrame, prevFrame, preloaded, loadErrors, renderAttempt]);
  
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
      (currentFrame + 1) % frames.length, // Next frame
      (currentFrame - 1 + frames.length) % frames.length, // Previous frame
      ...[...Array(frames.length).keys()].filter(i => 
        i !== currentFrame && 
        i !== (currentFrame + 1) % frames.length && 
        i !== (currentFrame - 1 + frames.length) % frames.length
      ) // Then the rest
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
  
  // Render all frames to allow for smooth transitions
  return (
    <>
      {frames.map((frame, index) => {
        const isCurrentFrame = index === currentFrame;
        
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: isCurrentFrame && (loadedFrames.length === 0 || loadedFrames[index]) ? opacity : 0,
              transition: 'opacity 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
              overflow: 'hidden',
              zIndex: 5,
              visibility: 'visible',
            }}
          >
            {preloaded[index] && !loadErrors[index] && (
              <Image
                src={frame.imageData}
                alt={`Weather radar frame ${index + 1}`}
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
                    newState[index] = true;
                    return newState;
                  });
                }}
              />
            )}
            
            {/* Show loading indicator if frame is not loaded yet */}
            {(!preloaded[index] && !loadErrors[index] && isCurrentFrame) && (
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
            {(loadErrors[index] && isCurrentFrame) && (
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