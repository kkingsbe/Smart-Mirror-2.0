# Weather Radar Component for Smart Mirrors

This component displays an animated weather radar map using OpenWeatherMap's embedded iframe. It's specifically designed for smart mirror displays, with no visible controls and automatic animation that plays and loops continuously.

## Features

- Displays animated weather radar maps for any location
- Automatically refreshes at configurable intervals
- Supports different weather layers (precipitation, temperature, etc.)
- No visible controls - perfect for smart mirror displays
- Automatically plays and loops the animation

## Usage

```jsx
import WeatherMap from '../components/WeatherMap';

// In your component:
<WeatherMap 
  lat={40.7128} // Your location coordinates
  lon={-74.0060}
  width={400}
  height={300}
/>
```

## Available Weather Layers

The component supports various weather layers from OpenWeatherMap:

- `PAC0`: Precipitation (default)
- `CL`: Cloudiness
- `PR0`: Pressure
- `WS10`: Wind speed
- `TA2`: Temperature

## Configuration

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| lat | number | required | Latitude of the location to display |
| lon | number | required | Longitude of the location to display |
| width | number | 400 | Width of the map in pixels |
| height | number | 300 | Height of the map in pixels |
| className | string | '' | Additional CSS classes to apply |
| refreshInterval | number | 10 | How often to refresh the map (in minutes) |
| layer | string | 'PAC0' | Weather layer to display |
| zoom | number | 6 | Zoom level (1-18) |

## No API Key Required

This component uses OpenWeatherMap's public website through an iframe, so no API key is required. This avoids CORS issues and simplifies implementation.

## Smart Mirror Integration

This component is designed to be integrated into a smart mirror interface. See the example at `/smart-mirror` for a demonstration of how it can be used in a smart mirror layout.

## Troubleshooting

If you encounter issues with the weather map:

1. Check that your browser allows iframes from openweathermap.org
2. Verify your coordinates are correct
3. Try adjusting the zoom level to better fit your location

## Example

```jsx
// Smart mirror weather section
<div className="weather-section">
  <h2>Weather Radar</h2>
  <WeatherMap 
    lat={40.7128} 
    lon={-74.0060}
    width={400}
    height={350}
    layer="PAC0" // Precipitation
    zoom={6}
    refreshInterval={5} // Refresh every 5 minutes
  />
</div>
``` 