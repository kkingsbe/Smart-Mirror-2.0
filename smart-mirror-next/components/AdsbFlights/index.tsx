'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Flight {
  hex: string;
  flight?: string;
  alt_baro?: number;
  gs?: number;
  track?: number;
  lat?: number;
  lon?: number;
  r?: string;
  t?: string;
  type?: string;
  distance?: number;
}

interface AdsbFlightsProps {
  refreshInterval?: number; // In seconds
  maxFlights?: number;
}

export default function AdsbFlights({ 
  refreshInterval = 15, 
  maxFlights = 10 
}: AdsbFlightsProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/adsb?max=${maxFlights}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setFlights(data.flights || []);
    } catch (err) {
      console.error('Error fetching flight data:', err);
      setError('Failed to fetch flight data');
    } finally {
      setLoading(false);
    }
  }, [maxFlights]);

  useEffect(() => {
    fetchFlights();
    
    const intervalId = setInterval(() => {
      fetchFlights();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchFlights]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-black text-white rounded-lg max-w-full">
      <h2 className="text-xl mb-4">Nearby Flights</h2>
      {loading && flights.length === 0 ? (
        <div>Loading flight data...</div>
      ) : flights.length === 0 ? (
        <div>No flights currently in range</div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {flights.map((flight) => (
            <div 
              key={flight.hex}
              className="p-2 border border-gray-700 rounded flex justify-between items-center"
            >
              <div>
                <span className="font-bold">{flight.flight?.trim() || 'Unknown'}</span>
                <span className="ml-2 text-gray-400">({flight.hex})</span>
              </div>
              <div className="flex flex-col text-right">
                <span>{flight.alt_baro ? `${flight.alt_baro} ft` : 'N/A'}</span>
                <span>{flight.distance ? `${flight.distance.toFixed(1)} nm` : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="text-xs mt-2 text-gray-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
} 