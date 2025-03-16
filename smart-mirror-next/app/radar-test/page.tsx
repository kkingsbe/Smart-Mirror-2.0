'use client';

import React, { useState } from 'react';
import NWSRadarMap from '../../components/NWSRadarMap';
import Link from 'next/link';

export default function RadarTestPage() {
  const [lat, setLat] = useState(39.8283); // Default to center of US
  const [lon, setLon] = useState(-98.5795);
  const [zoom, setZoom] = useState(7);
  const [darkTheme, setDarkTheme] = useState(true);
  const [frameCount, setFrameCount] = useState(6);
  const [frameInterval, setFrameInterval] = useState(15);
  const [opacity, setOpacity] = useState(0.5); // Default to 50% opacity
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The state is already updated via onChange, so we don't need to do anything here
    // This just prevents the form from refreshing the page
  };
  
  // Predefined locations for testing
  const locations = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    { name: 'Miami', lat: 25.7617, lon: -80.1918 },
    { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
    { name: 'Denver', lat: 39.7392, lon: -104.9903 },
    { name: 'Dallas', lat: 32.7767, lon: -96.7970 },
  ];
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#000', 
      color: 'white',
      padding: '20px'
    }}>
      <h1>NWS Radar Alignment Test</h1>
      <p>Use this page to test the alignment of NWS radar data with the OpenStreetMap base layer.</p>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1200px',
        width: '100%',
      }}>
        {/* Controls */}
        <div style={{ 
          padding: '15px',
          background: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '10px',
        }}>
          <h2>Controls</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Latitude</label>
                <input 
                  type="number" 
                  value={lat} 
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  step="0.0001"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#333', 
                    border: 'none', 
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Longitude</label>
                <input 
                  type="number" 
                  value={lon} 
                  onChange={(e) => setLon(parseFloat(e.target.value))}
                  step="0.0001"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#333', 
                    border: 'none', 
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Zoom Level</label>
                <input 
                  type="number" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseInt(e.target.value))}
                  min="1"
                  max="12"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#333', 
                    border: 'none', 
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Frame Count</label>
                <input 
                  type="number" 
                  value={frameCount} 
                  onChange={(e) => setFrameCount(parseInt(e.target.value))}
                  min="1"
                  max="12"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#333', 
                    border: 'none', 
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Frame Interval (minutes)</label>
                <input 
                  type="number" 
                  value={frameInterval} 
                  onChange={(e) => setFrameInterval(parseInt(e.target.value))}
                  min="5"
                  max="60"
                  step="5"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#333', 
                    border: 'none', 
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div style={{ flex: '1', minWidth: '200px', display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: '10px' }}>Dark Theme</label>
                <input 
                  type="checkbox" 
                  checked={darkTheme} 
                  onChange={(e) => setDarkTheme(e.target.checked)}
                  style={{ 
                    width: '20px', 
                    height: '20px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Radar Opacity: {opacity.toFixed(2)}
                </label>
                <input 
                  type="range" 
                  value={opacity} 
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  style={{ 
                    width: '100%', 
                    background: '#333', 
                    borderRadius: '4px',
                    accentColor: '#007bff'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '5px' }}>
                  <span>Transparent</span>
                  <span>Opaque</span>
                </div>
              </div>
            </div>
            
            <div>
              <button 
                type="submit"
                style={{ 
                  padding: '10px 15px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Update Map
              </button>
            </div>
          </form>
          
          <div style={{ marginTop: '15px' }}>
            <h3>Preset Locations</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {locations.map((location) => (
                <button 
                  key={location.name}
                  onClick={() => {
                    setLat(location.lat);
                    setLon(location.lon);
                  }}
                  style={{ 
                    padding: '8px 12px',
                    background: '#444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Radar Map */}
        <div style={{ 
          padding: '15px',
          background: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '10px',
        }}>
          <h2>NWS Precipitation Radar</h2>
          <p>Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)} | Zoom: {zoom} | Opacity: {opacity.toFixed(2)}</p>
          
          <NWSRadarMap 
            lat={lat}
            lon={lon}
            width={800}
            height={600}
            zoom={zoom}
            refreshInterval={5} // Refresh every 5 minutes
            darkTheme={darkTheme}
            frameCount={frameCount}
            frameInterval={frameInterval}
            opacity={opacity}
          />
          
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#aaa' }}>
            <p>
              The radar data should be properly aligned with the base map. If you notice any misalignment,
              try adjusting the zoom level or coordinates.
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <Link href="/" style={{ 
            display: 'inline-block',
            padding: '10px 15px',
            background: '#444',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
          }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 