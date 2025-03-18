'use client';

import React, { useState, useEffect } from 'react';
import NWSRadarMap from '../components/NWSRadarMap';
import DateTime from '../components/DateTime';
import WeatherGraph from '../components/WeatherGraph';

const modeInterval = 10000; // How often to toggle between modes (map, weather graph, etc)

// Constants for location and display settings
const LOCATION = {
  lat: 29.26224685583715,
  lon: -81.11348826187549
};
// const LOCATION = {
//   lat: 44.15626161999656,
//   lon: -65.38186375532595
// };
// const LOCATION = {
//   lat: 38.59317512992996,
//   lon: -121.49769410937496
// }

export default function Home() {
  const [showWeatherGraph, setShowWeatherGraph] = useState(false);
  
  useEffect(() => {
    // Toggle between weather graph and radar map every minute
    const intervalId = setInterval(() => {
      setShowWeatherGraph(prev => !prev);
    }, modeInterval);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="flex flex-col justify-center h-screen text-white bg-black overflow-clip">
      <DateTime />
      
      <div className="relative w-full flex flex-col items-center justify-center mt-auto mb-10">
        <div className={`transition-opacity duration-500 w-full max-w-[960px] mx-auto ${showWeatherGraph ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
          <WeatherGraph 
            lat={LOCATION.lat}
            lon={LOCATION.lon}
            width={960}
            height={450}
            refreshInterval={30} // Refresh every 30 minutes
            darkTheme={true}
          />
        </div>
        <div className={`transition-opacity duration-500 w-full max-w-[960px] mx-auto ${showWeatherGraph ? 'opacity-0 absolute pointer-events-none' : 'opacity-100'}`}>
          <NWSRadarMap 
            lat={LOCATION.lat}
            lon={LOCATION.lon}
            width={960}
            height={720}
            zoom={7}
            refreshInterval={5} // Refresh every 5 minutes
            darkTheme={true}
            frameCount={6} // 6 frames
            frameInterval={15} // 15-minute intervals
            opacity={0.5} // 50% opacity
            showLocationMarker={true} // Show location marker
            showFlights={true} // Show military flights from the dedicated endpoint
          />
        </div>
      </div>
    </main>
  );
}
