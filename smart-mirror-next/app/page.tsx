'use client';

import React from 'react';
import Link from 'next/link';
import NWSRadarMap from '../components/NWSRadarMap';

export default function Home() {
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
      <h1>Smart Mirror Weather Radar</h1>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1200px',
        width: '100%',
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '20px',
          width: '100%',
        }}>
          {/* NWS Precipitation Radar Map */}
          <div style={{ 
            padding: '15px',
            background: 'rgba(30, 30, 30, 0.5)',
            borderRadius: '10px',
          }}>
            <h2>NWS Precipitation Radar</h2>
            <p>National Weather Service radar data, 15-minute intervals</p>
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
            <div style={{ marginTop: '10px', textAlign: 'right' }}>
              <Link href="/radar-test" style={{ 
                display: 'inline-block',
                padding: '5px 10px',
                background: '#444',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '14px',
              }}>
                Test Radar Alignment
              </Link>
            </div>
          </div>
        </div>
        
        <div style={{ 
          padding: '15px',
          background: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '10px',
          marginTop: '20px',
        }}>
          <h2>How to Use</h2>
          <p>
            Add the RadarMap or NWSRadarMap component to your smart mirror interface with your desired location coordinates.
            The maps will automatically refresh at the specified interval.
          </p>
          
          <h3>OpenWeatherMap Radar</h3>
          <pre style={{ 
            background: '#111', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto',
            marginTop: '10px',
          }}>
{`import RadarMap from '../components/RadarMap';

// In your component:
<RadarMap 
  lat={40.7128} // Your location coordinates
  lon={-74.0060}
  width={600}
  height={500}
  // Optional props:
  // layer="PA0" // Weather layer to display (PA0, CL, TA2, etc.)
  // zoom={9} // Base zoom level
  // refreshInterval={5} // Refresh every 5 minutes
  // darkTheme={true} // Whether to use dark theme (default: true)
  // highResolution={true} // Whether to use high resolution tiles
  // ultraHighResolution={true} // Whether to use ultra-high resolution
  // extremeResolution={true} // Whether to use extreme resolution (maximum detail)
  // frameInterval={60} // Time between frames in minutes (default: 60)
/>`}
          </pre>
          
          <h3>NWS Radar</h3>
          <pre style={{ 
            background: '#111', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto',
            marginTop: '10px',
          }}>
{`import NWSRadarMap from '../components/NWSRadarMap';

// In your component:
<NWSRadarMap 
  lat={40.7128} // Your location coordinates
  lon={-74.0060}
  width={600}
  height={500}
  // Optional props:
  // zoom={7} // Base zoom level
  // refreshInterval={5} // Refresh every 5 minutes
  // darkTheme={true} // Whether to use dark theme (default: true)
  // frameCount={6} // Number of frames to display
  // frameInterval={15} // Time between frames in minutes (default: 15)
  // opacity={0.5} // Opacity of the radar layer (default: 0.5)
  // showLocationMarker={true} // Whether to show a marker at the specified location (default: true)
/>`}
          </pre>
          
          <div style={{ marginTop: '20px' }}>
            <Link href="/smart-mirror" style={{ 
              display: 'inline-block',
              padding: '10px 15px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              marginRight: '10px',
            }}>
              View Smart Mirror Demo
            </Link>
            
            <Link href="https://openweathermap.org/api/weather-map-2" target="_blank" style={{ 
              display: 'inline-block',
              padding: '10px 15px',
              background: '#444',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              marginRight: '10px',
            }}>
              OpenWeatherMap 2.0 API Docs
            </Link>
            
            <Link href="https://www.weather.gov/documentation/services-web-api" target="_blank" style={{ 
              display: 'inline-block',
              padding: '10px 15px',
              background: '#444',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
            }}>
              NWS API Docs
            </Link>
          </div>
        </div>
        
        <div style={{ 
          padding: '15px',
          background: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '10px',
          marginTop: '20px',
        }}>
          <h2>Available Weather Layers</h2>
          <p>
            The RadarMap component supports various weather layers from OpenWeatherMap 2.0 API:
          </p>
          
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            marginTop: '10px',
            color: 'white',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Layer Code</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Units</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>PA0</td>
                <td style={{ padding: '8px' }}>Accumulated precipitation (default)</td>
                <td style={{ padding: '8px' }}>mm</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>PR0</td>
                <td style={{ padding: '8px' }}>Precipitation intensity</td>
                <td style={{ padding: '8px' }}>mm/s</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>PAC0</td>
                <td style={{ padding: '8px' }}>Convective precipitation</td>
                <td style={{ padding: '8px' }}>mm</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>CL</td>
                <td style={{ padding: '8px' }}>Cloudiness</td>
                <td style={{ padding: '8px' }}>%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>APM</td>
                <td style={{ padding: '8px' }}>Atmospheric pressure</td>
                <td style={{ padding: '8px' }}>hPa</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>WND</td>
                <td style={{ padding: '8px' }}>Wind speed and direction</td>
                <td style={{ padding: '8px' }}>m/s</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>TA2</td>
                <td style={{ padding: '8px' }}>Air temperature</td>
                <td style={{ padding: '8px' }}>°C</td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>HRD0</td>
                <td style={{ padding: '8px' }}>Relative humidity</td>
                <td style={{ padding: '8px' }}>%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
