import { useState, useCallback, useRef } from 'react';
import { WeatherAlert } from '../types';
import { sortAlertsBySeverity } from '../utils';

interface UseWeatherAlertsProps {
  lat: number;
  lon: number;
  isVisible: boolean;
}

export const useWeatherAlerts = ({ lat, lon, isVisible }: UseWeatherAlertsProps) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<number>(0);
  const alertsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertAnimationRef = useRef<number | null>(null);

  const fetchWeatherAlerts = useCallback(async () => {
    try {
      // Fetch alerts within 20 miles of the location
      const response = await fetch(`/api/nws-alerts?lat=${lat}&lon=${lon}&radius=20`);
      
      if (!response.ok) {
        console.error(`Failed to fetch weather alerts: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.alerts && Array.isArray(data.alerts)) {
        // Sort alerts by severity (most severe first)
        const sortedAlerts = sortAlertsBySeverity(data.alerts);
        
        setAlerts(sortedAlerts);
        setCurrentAlert(0);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      // Don't show an error for alerts - they're not critical
    }
  }, [lat, lon]);

  // Set up alerts refresh interval
  const setupAlertsInterval = useCallback(() => {
    if (!isVisible) return;

    fetchWeatherAlerts();
    
    // Refresh alerts every 5 minutes
    alertsIntervalRef.current = setInterval(() => {
      fetchWeatherAlerts();
    }, 5 * 60 * 1000);
    
    return () => {
      if (alertsIntervalRef.current) {
        clearInterval(alertsIntervalRef.current);
      }
      if (alertAnimationRef.current) {
        cancelAnimationFrame(alertAnimationRef.current);
      }
    };
  }, [isVisible, fetchWeatherAlerts]);

  // Animate the weather alerts
  const setupAlertAnimation = useCallback(() => {
    if (alerts.length <= 1) return;

    const advanceAlert = () => {
      setCurrentAlert((prevAlert) => (prevAlert + 1) % alerts.length);
    };
    
    // Change alert every 5 seconds
    const alertInterval = setInterval(advanceAlert, 5000);
    
    return () => {
      clearInterval(alertInterval);
    };
  }, [alerts]);

  return {
    alerts,
    currentAlert,
    setCurrentAlert,
    setupAlertsInterval,
    setupAlertAnimation,
    fetchWeatherAlerts,
  };
}; 