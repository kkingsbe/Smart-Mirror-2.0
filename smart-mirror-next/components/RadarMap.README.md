# Weather Radar Component for Smart Mirrors

This component displays an animated weather radar map using OpenWeatherMap's tile API. It's specifically designed for smart mirror displays, with no visible controls, no cookie dialogs, and automatic animation that plays and loops continuously.

## Features

- Clean, minimal display with no UI elements or cookie dialogs
- Displays animated weather radar maps for any location
- Automatically refreshes at configurable intervals
- Supports different weather layers (precipitation, temperature, etc.)
- **Dark theme support** with a sleek dark map background
- **Ultra-high resolution option** for maximum detail and clarity
- **High-resolution option** for detailed weather visualization
- **Configurable frame intervals** (15-minute, 30-minute, etc.)
- No visible controls - perfect for smart mirror displays
- Automatically plays and loops the animation

## Usage

```jsx
import RadarMap from '../components/RadarMap';

// In your component:
<RadarMap 
  lat={40.7128} // Your location coordinates
  lon={-74.0060}
  width={500}
  height={400}
  darkTheme={true} // Optional: Use dark theme (default: true)
  ultraHighResolution={true} // Optional: Use ultra-high resolution tiles
  frameInterval={15} // Optional: Time between frames in minutes (default: 15)
/>
```

## Available Weather Layers

The component supports various weather layers from OpenWeatherMap:

- `precipitation_new`: Precipitation (default)
- `clouds_new`: Cloudiness
- `pressure_new`: Pressure
- `wind_new`: Wind speed
- `temp_new`: Temperature

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
| layer | string | 'precipitation_new' | Weather layer to display |
| zoom | number | 6 | Base zoom level (1-18) |
| darkTheme | boolean | true | Whether to use dark theme (recommended for smart mirrors) |
| highResolution | boolean | false | Whether to use high-resolution tiles for more detailed visualization |
| ultraHighResolution | boolean | false | Whether to use ultra-high resolution for maximum detail |
| frameInterval | number | 15 | Time between radar frames in minutes (15, 30, 60, etc.) |

## Dark Theme

The dark theme uses CartoDB's dark map tiles for a sleek, modern look that's perfect for smart mirrors. The dark background enhances visibility of weather data and reduces eye strain in low-light environments.

Benefits of the dark theme:
- Better contrast for weather data visualization
- Reduced brightness for nighttime viewing
- Sleek, modern aesthetic that blends with smart mirror interfaces
- Enhanced visibility of precipitation and temperature patterns

## Resolution Options

### Ultra-High Resolution

The ultra-high resolution option provides maximum detail for weather visualization:

1. Increases the zoom level by 4 levels (up to zoom level 14)
2. Uses OpenWeatherMap's @2x resolution tiles
3. Shows highly detailed weather patterns and precise location data
4. Displays an "ULTRA HD" indicator in the corner

Perfect for:
- Large displays
- Detailed local weather monitoring
- Precise storm tracking
- Professional weather monitoring

### High Resolution

The high-resolution option provides enhanced detail for weather visualization:

1. Increases the zoom level by 2 levels (up to zoom level 12)
2. Uses OpenWeatherMap's @2x resolution tiles
3. Automatically falls back to standard resolution if high-resolution tiles aren't available
4. Displays an "HD" indicator in the corner

Good for:
- Medium-sized displays
- Better detail than standard resolution
- Balanced between detail and performance

Note: Higher resolution modes may use more bandwidth and processing power.

## Frame Intervals

The component allows you to configure the time interval between radar frames:

- **15-minute intervals** (default): More frequent updates showing weather changes in greater detail
- **30-minute intervals**: Balanced approach showing weather movement over a moderate timespan
- **60-minute intervals**: Shows weather patterns over a longer period (up to 12 hours)

The component displays a small indicator in the top-right corner showing the current frame interval setting.

Note: The actual availability of data at specific intervals depends on OpenWeatherMap's data collection frequency. The component will attempt to fetch data at the specified interval, but may need to interpolate or use the closest available data points.

## How It Works

This component uses a proxy API route (`/api/radar-tile`) to fetch weather map tiles from OpenWeatherMap. The proxy approach:

1. Avoids CORS issues
2. Prevents cookie consent dialogs
3. Allows for server-side caching
4. Provides a clean, minimal display

The component creates an animation by cycling through multiple frames of radar data at different timestamps, creating a smooth animation effect.

## Smart Mirror Integration

This component is designed to be integrated into a smart mirror interface. See the example at `/smart-mirror` for a demonstration of how it can be used in a smart mirror layout.

## Example

```jsx
// Smart mirror weather section
<div className="weather-section">
  <h2>Weather Radar</h2>
  <RadarMap 
    lat={40.7128} 
    lon={-74.0060}
    width={500}
    height={400}
    layer="precipitation_new" // Precipitation
    zoom={8} // Higher zoom for more detail
    refreshInterval={5} // Refresh every 5 minutes
    darkTheme={true} // Use dark theme for smart mirror
    ultraHighResolution={true} // Use ultra-high resolution for maximum detail
    frameInterval={15} // 15-minute intervals between frames
  />
</div>
``` 