'use client';

import React from 'react';
import NWSRadarMap from '../components/NWSRadarMap';
import DateTime from '../components/DateTime';
export default function Home() {
  return (
    <main style={{ backgroundColor: 'black' }} className="flex flex-col justify-center h-screen text-white">
      <DateTime />
      <div className="flex flex-col items-center justify-center mt-auto mb-10">
        <NWSRadarMap 
          lat={29.26224685583715}
          lon={-81.11348826187549}
          width={600}
          height={500}
          zoom={7}
          refreshInterval={5} // Refresh every 5 minutes
          darkTheme={true}
          frameCount={6} // 6 frames
          frameInterval={15} // 15-minute intervals
          opacity={0.5} // 50% opacity
          showLocationMarker={true} // Show location marker
        />
      </div>
    </main>
  );
}
