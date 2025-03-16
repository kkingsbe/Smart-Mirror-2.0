<script>
    // Configuration
    let apiKey = "c5569a739aaa12a818efbf5e7f5d6154"; // Using the same API key from the weather component
    let lat = 29.2108; // Default latitude for Daytona Beach area
    let lon = -81.0228; // Default longitude for Daytona Beach area
    let zoom = 8; // Zoom level (0-18)
    let width = 600; // Width of the radar map
    let height = 400; // Height of the radar map
    
    // Radar layers
    const layers = {
        precipitation: "PAC0",  // Precipitation
        clouds: "CL0",          // Clouds
        pressure: "PR0",        // Pressure
        wind: "WND0",           // Wind
        temp: "TA0"             // Temperature
    };
    
    let selectedLayer = layers.precipitation; // Default layer
    let radarUrl = "";
    let isLoading = true;
    let error = null;
    
    // Function to generate the radar URL
    function generateRadarUrl() {
        isLoading = true;
        error = null;
        
        // OpenWeatherMap API URL for weather maps
        radarUrl = `https://tile.openweathermap.org/map/${selectedLayer}/${zoom}/${lat}/${lon}.png?appid=${apiKey}`;
        
        // For the actual implementation, we need to use the tile API correctly
        // This is a simplified version that will show a static image
        radarUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${lon},${lat},${zoom},0/${width}x${height}@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA&overlay=https://tile.openweathermap.org/map/${selectedLayer}/${zoom}/${Math.floor((lon + 180) / 360 * Math.pow(2, zoom))}/
${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png?appid=${apiKey}`;
        
        // Alternative approach using OpenWeatherMap's direct GIF API
        radarUrl = `https://openweathermap.org/weathermap?basemap=map&cities=false&layer=${selectedLayer}&lat=${lat}&lon=${lon}&zoom=${zoom}&appid=${apiKey}`;
        
        // Since the direct GIF API doesn't work with just a URL, we'll use their iframe approach
        isLoading = false;
    }
    
    // Initialize the radar URL
    generateRadarUrl();
    
    // Refresh the radar every 10 minutes
    setInterval(generateRadarUrl, 600000);
    
    // Function to change the selected layer
    function changeLayer(layer) {
        selectedLayer = layer;
        generateRadarUrl();
    }
</script>

<main>
    <div class="radar-container">
        <h2>Weather Radar</h2>
        
        {#if isLoading}
            <p>Loading radar...</p>
        {:else if error}
            <p class="error">Error loading radar: {error}</p>
        {:else}
            <div class="radar-frame">
                <iframe 
                    title="Weather Radar"
                    width="{width}" 
                    height="{height}" 
                    src="https://openweathermap.org/weathermap?basemap=map&cities=false&layer={selectedLayer}&lat={lat}&lon={lon}&zoom={zoom}" 
                    frameborder="0"
                    allowfullscreen>
                </iframe>
            </div>
        {/if}
        
        <div class="layer-controls">
            <button class:active={selectedLayer === layers.precipitation} on:click={() => changeLayer(layers.precipitation)}>Precipitation</button>
            <button class:active={selectedLayer === layers.clouds} on:click={() => changeLayer(layers.clouds)}>Clouds</button>
            <button class:active={selectedLayer === layers.pressure} on:click={() => changeLayer(layers.pressure)}>Pressure</button>
            <button class:active={selectedLayer === layers.wind} on:click={() => changeLayer(layers.wind)}>Wind</button>
            <button class:active={selectedLayer === layers.temp} on:click={() => changeLayer(layers.temp)}>Temperature</button>
        </div>
    </div>
</main>

<style>
    .radar-container {
        margin: 20px;
        padding: 10px;
        border-radius: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    h2 {
        font-size: 1.8em;
        margin-bottom: 10px;
        color: white;
    }
    
    .radar-frame {
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 10px;
    }
    
    .layer-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
        justify-content: center;
    }
    
    button {
        background-color: #333;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    button:hover {
        background-color: #555;
    }
    
    button.active {
        background-color: #007bff;
    }
    
    .error {
        color: #ff3e00;
        font-weight: bold;
    }
</style> 