'use client';

import React, { useState } from 'react';
import WeatherMap from '../../components/WeatherMap';

export default function WeatherIframeTestPage() {
  // Default coordinates (New York)
  const [lat, setLat] = useState<number>(40.7128);
  const [lon, setLon] = useState<number>(-74.0060);
  const [width, setWidth] = useState<number>(600);
  const [height, setHeight] = useState<number>(400);
  const [showControls, setShowControls] = useState<boolean>(false);
  
  // Available layers
  const layers = {
    precipitation: "PAC0",  // Precipitation
    clouds: "CL",          // Clouds
    pressure: "PR0",        // Pressure
    wind: "WS10",           // Wind
    temp: "TA2"             // Temperature
  };
  
  const [selectedLayer, setSelectedLayer] = useState<string>(layers.precipitation);
  
  // Toggle controls
  const toggleControls = () => {
    setShowControls(!showControls);
  };
  
  // Construct the iframe URL directly
  const iframeUrl = `https://openweathermap.org/weathermap?basemap=map&cities=false&layer=${selectedLayer}&lat=${lat}&lon=${lon}&zoom=6`;

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
      <h1>Weather Map Iframe Test</h1>
      
      <div style={{ marginBottom: '20px', border: '1px solid #444', padding: '10px' }}>
        <iframe 
          title="Weather Radar"
          width={width} 
          height={height} 
          src={iframeUrl}
          frameBorder="0"
          allowFullScreen
          style={{
            border: 'none',
            borderRadius: '8px',
          }}
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
        {showControls ? 'Hide Controls' : 'Show Controls'}
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
            <label style={{ display: 'block', marginBottom: '5px' }}>Width:</label>
            <input 
              type="number" 
              min="200" 
              max="1200" 
              value={width} 
              onChange={(e) => setWidth(parseInt(e.target.value))}
              style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Height:</label>
            <input 
              type="number" 
              min="200" 
              max="800" 
              value={height} 
              onChange={(e) => setHeight(parseInt(e.target.value))}
              style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Layer:</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setSelectedLayer(layers.precipitation)}
                style={{ 
                  padding: '8px 12px', 
                  background: selectedLayer === layers.precipitation ? '#007bff' : '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Precipitation
              </button>
              <button 
                onClick={() => setSelectedLayer(layers.clouds)}
                style={{ 
                  padding: '8px 12px', 
                  background: selectedLayer === layers.clouds ? '#007bff' : '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Clouds
              </button>
              <button 
                onClick={() => setSelectedLayer(layers.pressure)}
                style={{ 
                  padding: '8px 12px', 
                  background: selectedLayer === layers.pressure ? '#007bff' : '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Pressure
              </button>
              <button 
                onClick={() => setSelectedLayer(layers.wind)}
                style={{ 
                  padding: '8px 12px', 
                  background: selectedLayer === layers.wind ? '#007bff' : '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Wind
              </button>
              <button 
                onClick={() => setSelectedLayer(layers.temp)}
                style={{ 
                  padding: '8px 12px', 
                  background: selectedLayer === layers.temp ? '#007bff' : '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Temperature
              </button>
            </div>
          </div>
          
          <div>
            <p>Current iframe URL:</p>
            <div style={{ 
              background: '#111', 
              padding: '10px', 
              fontFamily: 'monospace',
              fontSize: '12px',
              wordBreak: 'break-all',
              borderRadius: '4px'
            }}>
              {iframeUrl}
            </div>
          </div>
        </div>
      )}
      
      <div>
        <p>This approach uses an iframe to embed OpenWeatherMap's weather map directly.</p>
        <p>No API key is required in the iframe URL as it's using OpenWeatherMap's public website.</p>
      </div>
    </div>
  );
} 