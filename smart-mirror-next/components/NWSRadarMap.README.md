# NWSRadarMap Component

A React component that displays animated National Weather Service (NWS) radar data overlaid on an OpenStreetMap base layer.

## Features

- Displays precipitation radar data from the National Weather Service
- Uses OpenStreetMap as the base layer
- Supports dark theme for smart mirror applications
- Automatically refreshes data at specified intervals
- Animated display with customizable frame count and interval
- Responsive design with customizable dimensions
- Adjustable radar layer opacity for better visibility of the base map
- Location marker to indicate the center coordinates on the map

## Usage

```jsx
import NWSRadarMap from '../components/NWSRadarMap';

// Basic usage
<NWSRadarMap 
  lat={40.7128} // Your location coordinates (New York City in this example)
  lon={-74.0060}
/>

// With all options
<NWSRadarMap 
  lat={40.7128}
  lon={-74.0060}
  width={600} // Width in pixels (default: 600)
  height={500} // Height in pixels (default: 500)
  className="custom-class" // Additional CSS class
  refreshInterval={5} // Refresh data every 5 minutes (default: 10)
  zoom={7} // Map zoom level (default: 7)
  darkTheme={true} // Use dark theme (default: true)
  frameCount={6} // Number of frames to display (default: 6)
  frameInterval={15} // Time between frames in minutes (default: 15)
  opacity={0.5} // Opacity of the radar layer (default: 0.5)
  showLocationMarker={true} // Show a marker at the specified location (default: true)
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lat` | number | (required) | Latitude coordinate for the center of the map |
| `lon` | number | (required) | Longitude coordinate for the center of the map |
| `width` | number | 600 | Width of the map in pixels |
| `height` | number | 500 | Height of the map in pixels |
| `className` | string | '' | Additional CSS class to apply to the container |
| `refreshInterval` | number | 10 | How often to refresh the data (in minutes) |
| `zoom` | number | 7 | Zoom level for the map (higher values = more zoomed in) |
| `darkTheme` | boolean | true | Whether to use a dark theme for the map |
| `frameCount` | number | 6 | Number of frames to display in the animation |
| `frameInterval` | number | 15 | Time between frames in minutes |
| `opacity` | number | 0.5 | Opacity of the radar layer (0.0 to 1.0) |
| `showLocationMarker` | boolean | true | Whether to show a marker at the specified location |

## API Details

This component uses the National Weather Service (NWS) API to fetch radar data. The data is fetched through a custom API route (`/api/nws-radar`) that handles the communication with the NWS servers.

The radar data is displayed at 15-minute intervals by default, with 6 frames showing the precipitation patterns over the last 90 minutes.

## Base Map

The base map is provided by OpenStreetMap through a custom API route (`/api/osm-tile`). When `darkTheme` is enabled, the component uses CartoDB's dark theme for better visibility on smart mirrors.

## Animation

The radar frames are animated automatically, with each frame displayed for 500ms before transitioning to the next frame. The animation loops continuously.

## Radar Opacity

The radar layer's opacity can be adjusted using the `opacity` prop. A lower value (closer to 0) makes the radar more transparent, allowing the base map to be more visible underneath. A higher value (closer to 1) makes the radar more opaque. The default value is 0.5 (50% opacity).

## Location Marker

The component can display a marker at the center of the map (the coordinates specified by `lat` and `lon`) to help users identify the exact location they're viewing. The marker includes a pulsing animation effect to make it more visible and displays the exact coordinates. This feature can be toggled using the `showLocationMarker` prop.

## Error Handling

The component includes error handling for cases where the NWS API is unavailable or returns invalid data. Error messages are displayed directly in the component. 