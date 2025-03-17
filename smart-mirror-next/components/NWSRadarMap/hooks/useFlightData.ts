import { useState, useEffect, useCallback } from 'react';
import { Flight } from '../types';

interface UseFlightDataProps {
  isVisible: boolean;
  refreshInterval?: number; // in seconds
  lat: number;
  lon: number;
  radius?: number;
}

export const useFlightData = ({ 
  isVisible, 
  refreshInterval = 15,
  lat,
  lon,
  radius = 200,
}: UseFlightDataProps) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchFlightData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Pass coordinates as query parameters
      const response = await fetch(`/api/adsb-flights?lat=${lat}&lon=${lon}&radius=${radius}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flight data: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort flights by distance
      const sortedFlights = data.ac?.sort((a: Flight, b: Flight) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      ) || [];
      
      setFlights(sortedFlights);
      setError(null);
    } catch (err) {
      console.error('Error fetching flight data:', err);
      setError('Failed to fetch flight data');
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon, radius]);
  
  const setupRefreshInterval = useCallback(() => {
    if (!isVisible) return;
    
    // Fetch data immediately
    fetchFlightData();
    
    // Set up interval for refreshing data
    const intervalId = setInterval(() => {
      fetchFlightData();
    }, refreshInterval * 1000);
    
    // Clean up function
    return () => {
      clearInterval(intervalId);
    };
  }, [isVisible, refreshInterval, fetchFlightData]);
  
  return {
    flights,
    isLoading,
    error,
    fetchFlightData,
    setupRefreshInterval,
  };
}; 