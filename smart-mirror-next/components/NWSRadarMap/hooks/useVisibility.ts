import { useState, useEffect, useRef } from 'react';

interface UseVisibilityProps {
  mapRef: React.RefObject<HTMLDivElement>;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const useVisibility = ({ mapRef, onVisibilityChange }: UseVisibilityProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const animationRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        onVisibilityChange?.(entry.isIntersecting);
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