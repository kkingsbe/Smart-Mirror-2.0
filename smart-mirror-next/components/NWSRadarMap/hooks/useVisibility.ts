import { useState, useEffect, useRef } from 'react';

interface UseVisibilityProps {
  mapRef: React.RefObject<HTMLDivElement>;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const useVisibility = ({ mapRef, onVisibilityChange }: UseVisibilityProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const animationRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisibilityState = useRef<boolean>(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visibilityChanged = lastVisibilityState.current !== entry.isIntersecting;
        lastVisibilityState.current = entry.isIntersecting;
        
        setIsVisible(entry.isIntersecting);
        
        if (visibilityChanged) {
          console.log(`Visibility changed to: ${entry.isIntersecting ? 'visible' : 'hidden'}`);
          onVisibilityChange?.(entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        observer.unobserve(mapRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [mapRef, onVisibilityChange]);

  return {
    isVisible,
    setIsVisible,
    animationRef,
    animationTimeoutRef,
  };
}; 