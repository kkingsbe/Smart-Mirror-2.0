import { useState, useCallback, useRef, useEffect } from 'react';
import { RadarFrame } from '../types';

interface UseRadarDataProps {
  lat: number;
  lon: number;
  zoom: number;
  frameCount: number;
  frameInterval: number;
  opacity: number;
  isVisible: boolean;
}

export const useRadarData = ({
  lat,
  lon,
  zoom,
  frameCount,
  frameInterval,
  opacity,
  isVisible,
}: UseRadarDataProps) => {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [loadedFrames, setLoadedFrames] = useState<boolean[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [animationPaused, setAnimationPaused] = useState<boolean>(false);
  const fetchRetryCount = useRef<number>(0);
  const maxRetries = 3;
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRadarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Pause animation while fetching new data
      setAnimationPaused(true);
      
      // Clear any existing animation interval
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      
      // Pass lat, lon, zoom, and opacity to the API to ensure proper alignment and appearance
      const response = await fetch(`/api/nws-radar?frameCount=${frameCount}&interval=${frameInterval}&lat=${lat}&lon=${lon}&zoom=${zoom}&opacity=${opacity}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch radar data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.frames || data.frames.length === 0) {
        throw new Error('No radar data available');
      }
      
      // Reset retry count on successful fetch
      fetchRetryCount.current = 0;
      
      // Set the frames (newest to oldest)
      const newFrames = data.frames.reverse();
      
      // If frameCount is 1, only keep the most recent frame
      const effectiveFrames = frameCount === 1 
        ? [newFrames[0]] // Just the most recent frame
        : newFrames;
      
      setFrames(effectiveFrames);
      
      // Initialize the loadedFrames array with true values since we have the data
      setLoadedFrames(new Array(effectiveFrames.length).fill(true));
      setCurrentFrame(0);
      
      // Set loading to false after successful fetch
      setIsLoading(false);
      
      // Resume animation after a short delay to allow the base map to stabilize
      // Only if we have more than one frame
      if (effectiveFrames.length > 1) {
        setTimeout(() => {
          console.log('Resuming radar animation');
          setAnimationPaused(false);
          
          // Set up animation interval if we have multiple frames
          setupAnimationInterval();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error fetching radar data:', error);
      
      // Implement retry logic
      if (fetchRetryCount.current < maxRetries) {
        fetchRetryCount.current++;
        console.log(`Retrying radar data fetch (${fetchRetryCount.current}/${maxRetries})...`);
        
        // Exponential backoff for retries
        setTimeout(() => {
          fetchRadarData();
        }, 2000 * Math.pow(2, fetchRetryCount.current - 1));
      } else {
        setError(error instanceof Error ? error.message : 'Failed to fetch radar data');
        setIsLoading(false);
        setAnimationPaused(false);
      }
    }
  }, [lat, lon, zoom, frameCount, frameInterval, opacity]);

  // Set up animation interval
  const setupAnimationInterval = useCallback(() => {
    // Don't set up animation if only one frame or animation is paused
    if (frames.length <= 1 || animationPaused) return;
    
    // Clear existing interval
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    
    // Set up interval to advance frames
    animationIntervalRef.current = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
    }, 1000); // Advance every second
    
    // Clean up on unmount
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [frames.length, animationPaused]);

  // Run animation when frames change or animation state changes
  useEffect(() => {
    if (isVisible && frames.length > 1 && !animationPaused) {
      setupAnimationInterval();
    }
    
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [isVisible, frames.length, animationPaused, setupAnimationInterval]);

  // Set up refresh interval
  const setupRefreshInterval = useCallback(() => {
    if (!isVisible) return;

    fetchRadarData();
    
    // Set up refresh interval
    refreshIntervalRef.current = setInterval(() => {
      fetchRadarData();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isVisible, fetchRadarData]);

  return {
    frames,
    loadedFrames,
    currentFrame,
    setCurrentFrame,
    isLoading,
    error,
    animationPaused,
    setAnimationPaused,
    setupRefreshInterval,
    fetchRadarData,
  };
}; 