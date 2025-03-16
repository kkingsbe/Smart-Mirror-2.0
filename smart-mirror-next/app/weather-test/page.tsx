'use client';

import React, { useState } from 'react';
import WeatherRadar from '../../components/WeatherRadar';

export default function WeatherTestPage() {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showControls, setShowControls] = useState<boolean>(false);
  
  // Default coordinates (New York)
  const [lat, setLat] = useState<number>(40.7128);
  const [lon, setLon] = useState<number>(-74.0060);
  const [layer, setLayer] = useState<string>('PR0');
  const [zoom, setZoom] = useState<number>(6);
  const [frames, setFrames] = useState<number>(5);
  
  // Toggle debug controls
  const toggleControls = () => {
    setShowControls(!showControls);
  };
  
  // Add debug info
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => `${new Date().toLocaleTimeString()}: ${info}\n${prev}`);
  };
  
  // Test direct image loading
  const testDirectImage = async () => {
    try {
      addDebugInfo('Testing direct image loading...');
      const response = await fetch(
        `/api/weather-map?lat=${lat}&lon=${lon}&layer=${layer}&zoom=${zoom}&frames=1`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.frameUrls || data.frameUrls.length === 0) {
        throw new Error('No URLs returned');
      }
      
      const url = data.frameUrls[0];
      addDebugInfo(`Got URL: ${url}`);
      
      // Try to load the image directly
      const img = new Image();
      img.onload = () => addDebugInfo('Direct image loaded successfully!');
      img.onerror = () => addDebugInfo('Direct image failed to load (CORS issue expected)');
      img.src = url;
    } catch (err) {
      addDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Test proxy image loading
  const testProxyImage = async () => {
    try {
      addDebugInfo('Testing proxy image loading...');
      const response = await fetch(
        `/api/weather-map?lat=${lat}&lon=${lon}&layer=${layer}&zoom=${zoom}&frames=1`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.frameUrls || data.frameUrls.length === 0) {
        throw new Error('No URLs returned');
      }
      
      const url = data.frameUrls[0];
      const proxyUrl = `/api/weather-map-image?url=${encodeURIComponent(url)}`;
      addDebugInfo(`Got proxy URL: ${proxyUrl}`);
      
      // Try to load the image through proxy
      const img = new Image();
      img.onload = () => addDebugInfo('Proxy image loaded successfully!');
      img.onerror = () => addDebugInfo('Proxy image failed to load');
      img.src = proxyUrl;
    } catch (err) {
      addDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#000', 
      color: 'white',
      padding: '20px'
    }}>
      <h1>Weather Radar Test</h1>
      
      <div style={{ marginBottom: '20px', border: '1px solid #444', padding: '10px' }}>
        <WeatherRadar 
          lat={lat}
          lon={lon}
          width={600}
          height={400}
          layer={layer}
          zoom={zoom}
          frames={frames}
        />
      </div>
      
      <button 
        onClick={toggleControls}
        style={{ 
          padding: '8px 16px', 
          marginBottom: '10px',
          background: '#333',
          color: 'white',
          border: '1px solid #555',
          borderRadius: '4px'
        }}
      >
        {showControls ? 'Hide Debug Controls' : 'Show Debug Controls'}
      </button>
      
      {showControls && (
        <div style={{ 
          width: '600px', 
          border: '1px solid #444', 
          padding: '15px',
          marginBottom: '20px',
          background: '#222'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Latitude:</label>
            <input 
              type="number" 
              value={lat} 
              onChange={(e) => setLat(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Longitude:</label>
            <input 
              type="number" 
              value={lon} 
              onChange={(e) => setLon(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Layer:</label>
            <select 
              value={layer} 
              onChange={(e) => setLayer(e.target.value)}
              style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
            >
              <option value="PR0">PR0 - Precipitation</option>
              <option value="TA2">TA2 - Temperature</option>
              <option value="WS10">WS10 - Wind Speed</option>
              <option value="CL">CL - Cloudiness</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Zoom Level (1-10):</label>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={zoom} 
              onChange={(e) => setZoom(parseInt(e.target.value))}
              style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Frames:</label>
            <input 
              type="number" 
              min="1" 
              max="24" 
              value={frames} 
              onChange={(e) => setFrames(parseInt(e.target.value))}
              style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={testDirectImage}
              style={{ 
                padding: '8px 16px', 
                background: '#444',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                flex: 1
              }}
            >
              Test Direct Image
            </button>
            
            <button 
              onClick={testProxyImage}
              style={{ 
                padding: '8px 16px', 
                background: '#444',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                flex: 1
              }}
            >
              Test Proxy Image
            </button>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            background: '#111', 
            padding: '10px', 
            height: '200px', 
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'pre-wrap'
          }}>
            {debugInfo || 'Debug information will appear here...'}
          </div>
        </div>
      )}
      
      <div>
        <p>If you see this page but no radar, check the browser console for errors.</p>
      </div>
    </div>
  );
} 