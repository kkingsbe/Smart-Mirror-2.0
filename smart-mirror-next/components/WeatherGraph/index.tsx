'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Filler,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeatherData {
  time: number;
  temp: number;
  feels_like: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  };
}

interface CurrentWeather {
  temp: number;
  low: number;
  high: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  };
}

interface WeatherGraphProps {
  lat: number;
  lon: number;
  width?: number;
  height?: number;
  refreshInterval?: number; // in minutes
  darkTheme?: boolean; // Add darkTheme property
}

const WeatherGraph: React.FC<WeatherGraphProps> = ({
  lat,
  lon,
  width = 800,
  height = 400,
  refreshInterval = 30, // Default refresh every 30 minutes
  darkTheme = true, // Default to dark theme
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDataFresh, setIsDataFresh] = useState<boolean>(false);

  // Calculate the height for the graph container
  // Reserve space for the current weather display (about 100px)
  const graphContainerHeight = Math.max(height - 100, 250); // Ensure minimum height of 250px

  // Calculate temperature range with 10% buffer on both ends and round to nice values
  const { minTemp, maxTemp, yAxisTicks } = useMemo(() => {
    if (!weatherData.length) {
      return { minTemp: 0, maxTemp: 100, yAxisTicks: [0, 20, 40, 60, 80, 100] };
    }

    const temps = weatherData.map(data => data.temp);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    
    // Calculate range and add 10% buffer on both ends
    const range = max - min;
    const buffer = Math.max(range * 0.1, 5); // At least 5 degrees buffer
    
    // Round down to nearest 5 for min
    const rawMin = min - buffer;
    const adjustedMin = Math.floor(rawMin / 5) * 5;
    
    // Round up to nearest 5 for max
    const rawMax = max + buffer;
    const adjustedMax = Math.ceil(rawMax / 5) * 5;
    
    // Generate tick values at regular intervals (multiples of 5 or 10)
    const totalRange = adjustedMax - adjustedMin;
    
    // Determine appropriate step size based on range
    let stepSize = 5; // Default step size
    if (totalRange > 50) {
      stepSize = 10;
    }
    if (totalRange > 100) {
      stepSize = 20;
    }
    
    // Generate ticks at regular intervals
    const ticks: number[] = [];
    for (let i = adjustedMin; i <= adjustedMax; i += stepSize) {
      ticks.push(i);
    }
    
    // Ensure we have the max value as a tick
    if (ticks[ticks.length - 1] !== adjustedMax) {
      ticks.push(adjustedMax);
    }
    
    return { 
      minTemp: adjustedMin, 
      maxTemp: adjustedMax,
      yAxisTicks: ticks
    };
  }, [weatherData]);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/weather-forecast?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.status}`);
      }
      
      const data = await response.json();
      setWeatherData(data.forecast);
      
      // Set current weather from the first forecast item
      if (data.forecast && data.forecast.length > 0) {
        // Find min and max temperatures in the forecast
        const temps = data.forecast.map((item: WeatherData) => item.temp);
        const low = Math.min(...temps);
        const high = Math.max(...temps);
        
        setCurrentWeather({
          temp: data.forecast[0].temp,
          low,
          high,
          weather: data.forecast[0].weather
        });
      }
      
      setError(null);
      // Trigger animation for fresh data
      setIsDataFresh(true);
      setTimeout(() => setIsDataFresh(false), 2000);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to load weather data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    // Fetch data initially
    fetchWeatherData();

    // Set up interval for refreshing data
    const intervalId = setInterval(fetchWeatherData, refreshInterval * 60 * 1000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchWeatherData]);

  // Format time for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    // Format as 12AM, 6AM, 12PM, 6PM
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}${ampm}`;
  };

  // Get weather icon URL
  const getWeatherIconUrl = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Create gradient fill
  const createGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, graphContainerHeight);
    gradient.addColorStop(0, 'rgba(126, 231, 199, 0.6)');  // Light teal at top
    gradient.addColorStop(0.3, 'rgba(83, 166, 192, 0.6)');  // Medium blue-teal
    gradient.addColorStop(1, 'rgba(40, 80, 150, 0.6)');    // Dark blue at bottom
    return gradient;
  };

  // Get weather icon based on condition and time
  const getWeatherIcon = (iconCode: string) => {
    // Custom icon mapping could be added here
    return (
      <div className="relative">
        <img 
          src={getWeatherIconUrl(iconCode)} 
          alt="Weather icon"
          className="w-full h-full object-contain filter drop-shadow-glow"
        />
      </div>
    );
  };

  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: weatherData.map(data => formatTime(data.time)),
    datasets: [
      {
        label: 'Temperature (°F)',
        data: weatherData.map(data => data.temp),
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: function(context: {chart: {ctx: CanvasRenderingContext2D, chartArea?: {top: number, bottom: number, left: number, right: number}}}) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return 'rgba(0, 0, 0, 0)';
          }
          return createGradient(ctx);
        },
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 3,
      },
    ],
  };

  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 60, // Space for weather icons
        right: 20,
        bottom: 10,
      }
    },
    scales: {
      y: {
        min: minTemp,
        max: maxTemp,
        position: 'right',
        ticks: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 32,
            weight: 'bold',
          },
          padding: 10,
          callback: function(value) {
            // Only show labels for our calculated tick values
            if (yAxisTicks.includes(Number(value))) {
              return value + '°';
            }
            return '';
          }
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1,
        },
        border: {
          display: false,
        },
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 32,
            weight: 'bold',
          },
          padding: 10,
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1,
          drawTicks: false,
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
      },
      line: {
        borderWidth: 3,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 16,
        },
        bodyFont: {
          size: 16,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const dataIndex = context.dataIndex;
            return `${context.parsed.y}°F - ${weatherData[dataIndex]?.weather.description || ''}`;
          },
        },
      },
    },
  };

  // Render weather icons above the chart
  const renderWeatherIcons = () => {
    if (!weatherData.length) return null;
    
    return (
      <div className="absolute top-0 left-0 right-0 flex justify-between px-8 py-2">
        {weatherData.map((data, index) => (
          <div key={index} className="flex flex-col items-center">
            <Image 
              src={getWeatherIconUrl(data.weather.icon)} 
              alt={data.weather.description}
              width={48}
              height={48}
              className="filter drop-shadow-glow"
              unoptimized // External images need this prop
            />
          </div>
        ))}
      </div>
    );
  };

  // Render current temperature and conditions
  const renderCurrentWeather = () => {
    if (!currentWeather) return null;
    
    return (
      <div className={`flex items-center mb-6 transition-all duration-500 ${isDataFresh ? 'scale-105' : 'scale-100'}`}>
        <div className="flex items-center">
          <div className="text-9xl font-extralight mr-6 tracking-tighter text-white drop-shadow-glow">
            {currentWeather.temp}°
          </div>
          <div className="flex flex-col">
            <div className="text-5xl font-extralight text-white/90 drop-shadow-md">
              {currentWeather.high}°<span className="text-white/70">/{currentWeather.low}°</span>
            </div>
            <div className="text-2xl font-light text-white/80 mt-1">
              Fahrenheit (°F)
            </div>
          </div>
        </div>
        <div className="flex items-center ml-auto">
          <Image 
            src={getWeatherIconUrl(currentWeather.weather.icon)} 
            alt={currentWeather.weather.description}
            width={112}
            height={112}
            className="filter drop-shadow-glow"
            unoptimized // External images need this prop
          />
          <div className="text-3xl font-light ml-3 text-white/90 drop-shadow-md">
            {currentWeather.weather.description}
          </div>
        </div>
      </div>
    );
  };

  if (loading && weatherData.length === 0) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg"
      >
        <div className="flex flex-col items-center">
          <div className="animate-pulse w-16 h-16 rounded-full bg-white/20 mb-4"></div>
          <p className="text-white text-xl">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg"
      >
        <p className="text-red-400 text-xl">
          <span className="mr-2">⚠️</span>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {renderCurrentWeather()}
      <div 
        style={{ width, height: graphContainerHeight }} 
        className="relative p-4 bg-black/50 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 z-0"></div>
        {renderWeatherIcons()}
        {weatherData.length > 0 ? (
          <div className="relative z-10 h-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p className="text-white text-center">No weather data available</p>
        )}
      </div>
    </div>
  );
};

export default WeatherGraph; 