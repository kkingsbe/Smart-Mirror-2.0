'use client';

import React, { useState, useEffect } from 'react';
import RadarMap from '../../components/RadarMap';

export default function SmartMirrorPage() {
  // State for current time
  const [time, setTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Format time and date
  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#000', 
      color: 'white',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Clock and Date */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '30px',
      }}>
        <div style={{ fontSize: '5rem', fontWeight: 'bold' }}>{timeString}</div>
        <div style={{ fontSize: '1.5rem' }}>{dateString}</div>
      </div>
      
      {/* Main Content */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        flex: 1,
      }}>
        {/* Weather Radar */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h2 style={{ marginBottom: '10px', fontSize: '1.5rem' }}>Weather Radar</h2>
          <RadarMap 
            lat={40.7128} // New York - change to your location
            lon={-74.0060}
            width={600}
            height={500}
            layer="PA0" // Accumulated precipitation (OpenWeatherMap 2.0 API)
            zoom={9} // Higher base zoom level for more detail
            refreshInterval={5} // Refresh every 5 minutes
            darkTheme={true} // Use dark theme for smart mirror
            extremeResolution={true} // Use extreme resolution tiles
            frameInterval={60} // 60-minute intervals between frames (for 2.0 API)
          />
        </div>
        
        {/* Placeholder for other smart mirror widgets */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h2 style={{ marginBottom: '10px', fontSize: '1.5rem' }}>Weather Forecast</h2>
          <div style={{ 
            width: '100%', 
            height: '500px', // Match the radar height
            backgroundColor: 'rgba(30, 30, 30, 0.7)', // Darker background for dark theme
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <p>Weather Forecast Widget</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div style={{ 
        marginTop: '30px',
        textAlign: 'center',
        fontSize: '0.8rem',
        opacity: 0.7,
      }}>
        <p>Smart Mirror Demo - Weather Radar Component (OpenWeatherMap 2.0 API)</p>
      </div>
    </div>
  );
} 