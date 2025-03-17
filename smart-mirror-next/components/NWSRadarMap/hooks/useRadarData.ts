import { useState, useCallback, useRef } from 'react';
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

  const fetchRadarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Pause animation while fetching new data
      setAnimationPaused(true);
      
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
      setFrames(newFrames);
      
      // Initialize the loadedFrames array with true values since we have the data
      setLoadedFrames(new Array(newFrames.length).fill(true));
      setCurrentFrame(0);
      
      // Set loading to false after successful fetch
      setIsLoading(false);
      
      // Resume animation after a short delay to allow the base map to stabilize
      setTimeout(() => {
        console.log('Resuming radar animation');
        setAnimationPaused(false);
      }, 500);
      
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