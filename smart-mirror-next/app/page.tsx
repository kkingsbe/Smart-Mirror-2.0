'use client';

import React from 'react';
import NWSRadarMap from '../components/NWSRadarMap';
import DateTime from '../components/DateTime';
import WeatherGraph from '../components/WeatherGraph';

export default function Home() {
  return (
    <main className="flex flex-col justify-center h-screen text-white bg-black">
      <DateTime />
      <div className="flex flex-col items-center justify-center mt-auto mb-10">
        <div className="mb-4 w-full max-w-[960px]">
          <WeatherGraph 
            lat={29.26224685583715}
            lon={-81.11348826187549}
            width={960}
            height={450}
            refreshInterval={30} // Refresh every 30 minutes
            darkTheme={true}
          />
        </div>
        {/* <NWSRadarMap 
          lat={29.26224685583715}
          lon={-81.11348826187549}
          width={960}
          height={720}
          zoom={9}
          refreshInterval={5} // Refresh every 5 minutes
          darkTheme={true}
          frameCount={6} // 6 frames
          frameInterval={15} // 15-minute intervals
          opacity={0.5} // 50% opacity
          showLocationMarker={true} // Show location marker
        /> */}
      </div>
    </main>
  );
}
