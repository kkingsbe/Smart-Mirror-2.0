import React, { useEffect, useState, useRef } from 'react';

interface WeatherRadarProps {
  lat: number;
  lon: number;
  layer?: string;
  zoom?: number;
  width?: number;
  height?: number;
  frames?: number;
  refreshInterval?: number; // in minutes
}

const WeatherRadar: React.FC<WeatherRadarProps> = ({
  lat,
  lon,
  layer = 'PR0', // Precipitation intensity by default
  zoom = 6,
  width = 400,
  height = 400,
  frames = 10,
  refreshInterval = 30, // refresh every 30 minutes
}) => {
  const [frameUrls, setFrameUrls] = useState<string[]>([]);
  const [proxyFrameUrls, setProxyFrameUrls] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);

  // Fetch frame URLs from our API
  const fetchFrameUrls = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/weather-map?lat=${lat}&lon=${lon}&layer=${layer}&zoom=${zoom}&frames=${frames}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weather map data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      if (!data.frameUrls || !Array.isArray(data.frameUrls) || data.frameUrls.length === 0) {
        throw new Error('No frame URLs returned from API');
      }
      
      // Store the original URLs
      setFrameUrls(data.frameUrls);
      
      // Create proxy URLs for each frame
      const proxiedUrls = data.frameUrls.map((url: string) => 
        `/api/weather-map-image?url=${encodeURIComponent(url)}`
      );
      setProxyFrameUrls(proxiedUrls);
      
      // Reset loaded images state
      setLoadedImages(new Array(data.frameUrls.length).fill(false));
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching frame URLs:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  // Initialize and handle periodic refresh
  useEffect(() => {
    fetchFrameUrls();
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      fetchFrameUrls();
    }, refreshInterval * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [lat, lon, layer, zoom, frames, refreshInterval]);

  // Handle image loading
  const handleImageLoad = (index: number) => {
    console.log(`Image ${index} loaded successfully`);
    setLoadedImages(prev => {
      const newLoadedImages = [...prev];
      newLoadedImages[index] = true;
      return newLoadedImages;
    });
  };

  const handleImageError = (index: number, e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`Error loading image ${index}:`, e);
    // Mark as loaded anyway to prevent blocking animation
    handleImageLoad(index);
  };

  // Start animation when all images are loaded or after timeout
  useEffect(() => {
    if (proxyFrameUrls.length === 0) return;
    
    // Reset animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Check if all images are loaded or start animation after timeout
    const allImagesLoaded = loadedImages.every(loaded => loaded);
    const timeoutId = setTimeout(() => {
      if (!allImagesLoaded) {
        console.log("Starting animation after timeout, not all images loaded");
        startAnimation();
      }
    }, 10000); // 10 second timeout
    
    if (allImagesLoaded && proxyFrameUrls.length > 0) {
      console.log("All images loaded, starting animation");
      clearTimeout(timeoutId);
      startAnimation();
    }
    
    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loadedImages, proxyFrameUrls]);

  // Animation function
  const startAnimation = () => {
    const animate = () => {
      setCurrentFrame(prev => (prev + 1) % proxyFrameUrls.length);
      animationRef.current = requestAnimationFrame(() => {
        // Add a delay between frames
        setTimeout(animate, 500); // 500ms between frames
      });
    };
    
    animate();
  };

  if (isLoading && proxyFrameUrls.length === 0) {
    return <div>Loading weather radar...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (proxyFrameUrls.length === 0) {
    return <div>No radar data available</div>;
  }

  return (
    <div className="weather-radar" style={{ width, height, position: 'relative', overflow: 'hidden', background: '#333' }}>
      {proxyFrameUrls.map((url, index) => (
        <img
          key={index}
          src={url}
          alt={`Weather radar frame ${index + 1}`}
          onLoad={() => handleImageLoad(index)}
          onError={(e) => handleImageError(index, e)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: index === currentFrame ? 'block' : 'none',
          }}
        />
      ))}
    </div>
  );
};

export default WeatherRadar; 